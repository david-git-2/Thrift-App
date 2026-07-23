import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useTenantStore, clearTenantWorkspaceStorage } from "./tenantStore";

export interface AuthUserSnapshot {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  provider: string | null;
}

export interface AuthMemberSnapshot {
  id: number;
  email: string;
  role: "superadmin" | "admin" | "staff" | "viewer";
  actorType: "membership" | "customer_group_member";
  name: string | null;
  tenantId: number | null;
  customerGroupId: number | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AuthTenantSnapshot {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface TenantPreferenceSchema {
  thrift?: {
    default_purchase_currency?: number;
    default_cost_currency?: number;
  };
}

export interface AuthAccessSnapshot {
  scope: "platform" | "app" | "shop";
  matchedRole: AuthMemberSnapshot["role"];
  user: AuthUserSnapshot;
  member: AuthMemberSnapshot;
  tenant: AuthTenantSnapshot | null;
  customerGroup: null;
  activeModuleKeys: string[];
  tenantPreference: TenantPreferenceSchema;
  savedAt: string;
}

type StoredAuthAccess = AuthAccessSnapshot & {
  schemaVersion: 2;
};

const STORAGE_KEY = "brandwala.auth.access.v2";

const readStorage = (): StoredAuthAccess | null => {
  if (typeof window === "undefined") return null;
  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) return null;
  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredAuthAccess>;
    if (parsed?.schemaVersion !== 2 || !parsed?.user || !parsed?.member) {
      return null;
    }
    return normalizeStoredAccess(parsed);
  } catch {
    return null;
  }
};

const normalizeStoredAccess = (
  parsed: Partial<StoredAuthAccess>
): StoredAuthAccess | null => {
  if (parsed?.schemaVersion !== 2 || !parsed?.user || !parsed?.member) {
    return null;
  }
  return {
    ...parsed,
    tenantPreference: parsed.tenantPreference ?? {}
  } as StoredAuthAccess;
};

const writeStorage = (snapshot: StoredAuthAccess | null) => {
  if (typeof window === "undefined") return;
  if (!snapshot) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }
};

export const useAuthStore = defineStore("auth", () => {
  const snapshot = ref<StoredAuthAccess | null>(readStorage());
  const tenantStore = useTenantStore();

  const access = computed(() => snapshot.value);
  const user = computed(() => snapshot.value?.user ?? null);
  const member = computed(() => snapshot.value?.member ?? null);
  const tenant = computed(() => snapshot.value?.tenant ?? null);
  const selectedTenant = computed(() =>
    snapshot.value?.scope === "app"
      ? tenantStore.selectedTenant
      : (snapshot.value?.tenant ?? null)
  );
  const availableAdminTenants = computed(
    () => tenantStore.availableAdminTenants
  );
  const activeModuleKeys = computed(
    () => snapshot.value?.activeModuleKeys ?? []
  );
  const scope = computed(() => snapshot.value?.scope ?? null);
  const matchedRole = computed(() => snapshot.value?.matchedRole ?? null);
  const isAuthenticated = computed(() => Boolean(snapshot.value?.user));
  const hasAccess = computed(() => Boolean(snapshot.value?.member?.isActive));
  const actorId = computed(() => snapshot.value?.member?.id ?? null);
  const tenantId = computed(
    () =>
      selectedTenant.value?.id ??
      snapshot.value?.tenant?.id ??
      snapshot.value?.member?.tenantId ??
      null
  );
  const tenantSlug = computed(
    () => selectedTenant.value?.slug ?? snapshot.value?.tenant?.slug ?? null
  );
  const tenantPreference = computed(
    () => snapshot.value?.tenantPreference ?? {}
  );
  const thriftDefaultCostCurrencyId = computed(() => {
    const value = tenantPreference.value.thrift?.default_cost_currency;
    return typeof value === "number" ? value : null;
  });
  const thriftDefaultPurchaseCurrencyId = computed(() => {
    const value = tenantPreference.value.thrift?.default_purchase_currency;
    return typeof value === "number" ? value : null;
  });

  const saveAccess = (nextAccess: Omit<StoredAuthAccess, "schemaVersion">) => {
    snapshot.value = {
      ...nextAccess,
      schemaVersion: 2
    };
    writeStorage(snapshot.value);
    if (nextAccess.scope === "app") {
      tenantStore.hydrateSelectedTenantFromAuth(nextAccess.tenant);
    }
  };

  const clearAccess = () => {
    snapshot.value = null;
    writeStorage(null);
    clearTenantWorkspaceStorage();
  };

  return {
    access,
    clearAccess,
    hasAccess,
    isAuthenticated,
    member,
    actorId,
    availableAdminTenants,
    matchedRole,
    saveAccess,
    selectedTenant,
    scope,
    tenant,
    tenantId,
    tenantSlug,
    tenantPreference,
    thriftDefaultCostCurrencyId,
    thriftDefaultPurchaseCurrencyId,
    user,
    activeModuleKeys
  };
});
