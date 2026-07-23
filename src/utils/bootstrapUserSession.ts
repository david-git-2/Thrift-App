import { supabase } from "../boot/supabase";
import { useAuthStore } from "../stores/authStore";
import type { TenantPreferenceSchema } from "../stores/authStore";
import { useTenantStore } from "../stores/tenantStore";
import { THRIFT_TENANT_SLUG } from "../constants/thriftTenant";

const normalizeTenantSlug = (value: string | null | undefined) =>
  value?.trim().toLowerCase() || null;

export type BootstrapSession = {
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  };
};

export type BootstrapResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Resolve membership + tenant context and persist authStore access snapshot.
 * Does not navigate — callers decide routing.
 */
export async function bootstrapUserSession(
  userEmail: string,
  session: BootstrapSession
): Promise<BootstrapResult> {
  const authStore = useAuthStore();
  const tenantStore = useTenantStore();
  const formattedEmail = userEmail.trim().toLowerCase();

  const { data: membershipData, error: membershipError } = await supabase.rpc(
    "check_login_membership",
    {
      p_email: formattedEmail,
      p_scope: "app"
    }
  );

  if (membershipError) {
    console.error("Membership check failed", membershipError);
    return { ok: false, error: "membership_failed" };
  }

  const result = Array.isArray(membershipData)
    ? membershipData[0]
    : membershipData;
  if (
    !result?.has_match ||
    result.member_id === null ||
    !result.member_email ||
    !result.matched_role
  ) {
    return { ok: false, error: "no_membership" };
  }

  const { data: tenantsData, error: tenantsError } = await supabase.rpc(
    "list_tenants_by_membership",
    {
      p_email: formattedEmail,
      p_role: null,
      p_tenant_id: null
    }
  );

  if (tenantsError) {
    console.error("Fetching tenants failed", tenantsError);
    return { ok: false, error: "membership_failed" };
  }

  const availableTenants = (tenantsData as any[]) ?? [];
  if (availableTenants.length === 0) {
    return { ok: false, error: "no_membership" };
  }

  tenantStore.setAvailableAdminTenants(availableTenants);

  const targetTenant =
    availableTenants.find(
      tenant => normalizeTenantSlug(tenant.slug) === THRIFT_TENANT_SLUG
    ) ?? null;

  if (!targetTenant) {
    return { ok: false, error: "invalid_tenant" };
  }

  const { data: bootstrapData, error: bootstrapError } = await supabase.rpc(
    "get_app_bootstrap_context",
    {
      p_email: formattedEmail,
      p_tenant_id: targetTenant.id,
      p_membership_id:
        result.member_tenant_id === targetTenant.id ? result.member_id : null
    }
  );

  if (bootstrapError) {
    console.error("Bootstrap fetch failed", bootstrapError);
    return { ok: false, error: "membership_failed" };
  }

  const bootstrap = Array.isArray(bootstrapData)
    ? bootstrapData[0]
    : bootstrapData;
  if (
    !bootstrap ||
    bootstrap.member_id === null ||
    bootstrap.tenant_id === null ||
    !bootstrap.tenant_name ||
    !bootstrap.tenant_slug ||
    !bootstrap.member_role
  ) {
    return { ok: false, error: "no_membership" };
  }

  if (normalizeTenantSlug(bootstrap.tenant_slug) !== THRIFT_TENANT_SLUG) {
    return { ok: false, error: "invalid_tenant" };
  }

  authStore.saveAccess({
    scope: "app",
    matchedRole: bootstrap.member_role,
    user: {
      id: session.user.id,
      email: formattedEmail,
      fullName:
        (session.user.user_metadata?.full_name as string | undefined) ??
        (session.user.user_metadata?.name as string | undefined) ??
        null,
      avatarUrl:
        (session.user.user_metadata?.avatar_url as string | undefined) ?? null,
      provider:
        (session.user.app_metadata?.provider as string | undefined) ?? null
    },
    member: {
      id: bootstrap.member_id,
      email: bootstrap.member_email?.trim().toLowerCase() ?? formattedEmail,
      role: bootstrap.member_role,
      actorType: "membership",
      name: null,
      tenantId: bootstrap.tenant_id,
      customerGroupId: null,
      isActive: Boolean(bootstrap.member_is_active),
      createdAt: null,
      updatedAt: null
    },
    tenant: {
      id: bootstrap.tenant_id,
      name: bootstrap.tenant_name,
      slug: bootstrap.tenant_slug,
      isActive: Boolean(bootstrap.tenant_is_active)
    },
    customerGroup: null,
    activeModuleKeys: bootstrap.active_module_keys ?? [],
    tenantPreference: (bootstrap.tenant_preference ??
      {}) as TenantPreferenceSchema,
    savedAt: new Date().toISOString()
  });

  return { ok: true };
}
