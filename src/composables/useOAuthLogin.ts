import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../boot/supabase";
import { useAuthStore } from "../stores/authStore";
import { useTenantStore } from "../stores/tenantStore";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

import { THRIFT_TENANT_SLUG } from "../constants/thriftTenant";

export { THRIFT_TENANT_SLUG };

const normalizeTenantSlug = (value: string | null | undefined) =>
  value?.trim().toLowerCase() || null;

export function useOAuthLogin() {
  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();
  const tenantStore = useTenantStore();
  const isLoading = ref(false);

  const sendBackToLogin = async (loginError: string) => {
    authStore.clearAccess();
    await supabase.auth.signOut();
    await router.replace({ path: "/login", query: { error: loginError } });
  };

  // 1. Google OAuth
  const handleGoogleLogin = async () => {
    isLoading.value = true;
    const callbackSearchParams = new URLSearchParams({
      scope: "app",
      tenant_slug: THRIFT_TENANT_SLUG
    });

    let redirectTo = `${window.location.origin}/#/auth/callback?${callbackSearchParams.toString()}`;

    if (Capacitor.isNativePlatform()) {
      redirectTo = `https://tradeflowbd.pages.dev/auth/callback?scope=app&tenant_slug=${THRIFT_TENANT_SLUG}&app_redirect=thrift`;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            skipBrowserRedirect: true
          }
        });
        if (error) throw error;
        if (data?.url) {
          await Browser.open({ url: data.url });
        }
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo
          }
        });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error("Google OAuth error", err);
    } finally {
      isLoading.value = false;
    }
  };

  // 2. Native Email/Password login
  const handleEmailPasswordLogin = async (email: string, password: string) => {
    isLoading.value = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      if (error) throw error;
      if (data.session) {
        return await bootstrapUserSession(
          data.session.user.email ?? email,
          data.session
        );
      }
      return false;
    } catch (err: any) {
      console.error("Email password login failed:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 3. Native OTP login (Send code)
  const handleSendOTP = async (email: string) => {
    isLoading.value = true;
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false // only allow existing members
        }
      });
      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error("Send OTP failed:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 4. Native OTP login (Verify code)
  const handleVerifyOTP = async (email: string, token: string) => {
    isLoading.value = true;
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type: "email"
      });
      if (error) throw error;
      if (data.session) {
        return await bootstrapUserSession(
          data.session.user.email ?? email,
          data.session
        );
      }
      return false;
    } catch (err: any) {
      console.error("Verify OTP failed:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Shared Session Bootstrapper
  const bootstrapUserSession = async (userEmail: string, session: any) => {
    const formattedEmail = userEmail.trim().toLowerCase();

    // 1. Check membership
    const { data: membershipData, error: membershipError } = await supabase.rpc(
      "check_login_membership",
      {
        p_email: formattedEmail,
        p_scope: "app"
      }
    );

    if (membershipError) {
      console.error("Membership check failed", membershipError);
      await sendBackToLogin("membership_failed");
      return false;
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
      await sendBackToLogin("no_membership");
      return false;
    }

    // 2. Resolve tenants by membership
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
      await sendBackToLogin("membership_failed");
      return false;
    }

    const availableTenants = (tenantsData as any[]) ?? [];
    if (availableTenants.length === 0) {
      await sendBackToLogin("no_membership");
      return false;
    }

    tenantStore.setAvailableAdminTenants(availableTenants);

    const targetTenant =
      availableTenants.find(
        tenant => normalizeTenantSlug(tenant.slug) === THRIFT_TENANT_SLUG
      ) ?? null;

    if (!targetTenant) {
      await sendBackToLogin("invalid_tenant");
      return false;
    }

    // 3. Bootstrap app context
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
      await sendBackToLogin("membership_failed");
      return false;
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
      await sendBackToLogin("no_membership");
      return false;
    }

    if (normalizeTenantSlug(bootstrap.tenant_slug) !== THRIFT_TENANT_SLUG) {
      await sendBackToLogin("invalid_tenant");
      return false;
    }

    // 4. Save access snapshot
    authStore.saveAccess({
      scope: "app",
      matchedRole: bootstrap.member_role,
      user: {
        id: session.user.id,
        email: formattedEmail,
        fullName:
          session.user.user_metadata?.full_name ??
          session.user.user_metadata?.name ??
          null,
        avatarUrl: session.user.user_metadata?.avatar_url ?? null,
        provider: session.user.app_metadata?.provider ?? null
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
        {}) as import("../stores/authStore").TenantPreferenceSchema,
      savedAt: new Date().toISOString()
    });

    await router.replace("/");
    return true;
  };

  // Backwards compatible method for callback page
  const processLoginResult = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session?.user) {
        await router.replace("/login");
        return false;
      }

      // Check if we are running in system browser (web) but user logged in via native app trigger
      const searchParams = new URLSearchParams(window.location.search);
      const isAppScope = searchParams.get("scope") === "app";
      if (isAppScope && !Capacitor.isNativePlatform()) {
        const tenantSlug = searchParams.get("tenant_slug") || "thrift";
        const accessToken = session.access_token;
        const refreshToken = session.refresh_token;

        if (accessToken && refreshToken) {
          const nativeRedirectUrl = `com.brandwala.thriftapp://auth-callback?scope=app&tenant_slug=${tenantSlug}&access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
          // Redirect the browser to custom scheme
          window.location.href = nativeRedirectUrl;
          return true;
        }
      }

      return await bootstrapUserSession(session.user.email ?? "", session);
    } catch (err: any) {
      console.error("Login processing failed", err);
      await sendBackToLogin("auth_failed");
      return false;
    }
  };

  return {
    handleGoogleLogin,
    handleEmailPasswordLogin,
    handleSendOTP,
    handleVerifyOTP,
    processLoginResult,
    isLoading
  };
}
