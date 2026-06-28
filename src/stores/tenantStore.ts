import { defineStore } from "pinia";

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface TenantStoreState {
  items: Tenant[];
  availableAdminTenants: Tenant[];
  selectedTenantId: number | null;
  selectedTenantSlug: string | null;
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY = "brandwala.tenant.workspace.v1";

const readStorage = () => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeStorage = (value: any) => {
  if (typeof window === "undefined") return;
  if (!value) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }
};

export const clearTenantWorkspaceStorage = () => {
  writeStorage(null);
};

const storedWorkspace = readStorage();

export const useTenantStore = defineStore("tenant", {
  state: (): TenantStoreState => ({
    items: [],
    availableAdminTenants: storedWorkspace?.availableAdminTenants ?? [],
    selectedTenantId: storedWorkspace?.selectedTenantId ?? null,
    selectedTenantSlug: storedWorkspace?.selectedTenantSlug ?? "thrift",
    loading: false,
    error: null
  }),

  getters: {
    selectedTenant(state): Tenant | null {
      return (
        state.availableAdminTenants.find(
          t => t.id === state.selectedTenantId
        ) ?? null
      );
    }
  },

  actions: {
    persistWorkspaceState() {
      writeStorage({
        schemaVersion: 1,
        availableAdminTenants: this.availableAdminTenants,
        selectedTenantId: this.selectedTenantId,
        selectedTenantSlug: this.selectedTenantSlug
      });
    },

    setAvailableAdminTenants(tenants: Tenant[]) {
      this.availableAdminTenants = tenants;
      if (this.selectedTenantId) {
        const stillAvailable = tenants.some(
          t => t.id === this.selectedTenantId
        );
        if (!stillAvailable) {
          this.selectedTenantId = null;
          this.selectedTenantSlug = null;
        }
      }
      this.persistWorkspaceState();
    },

    setSelectedTenant(tenant: Pick<Tenant, "id" | "slug"> | null) {
      this.selectedTenantId = tenant?.id ?? null;
      this.selectedTenantSlug = tenant?.slug ?? null;
      this.persistWorkspaceState();
    },

    clearSelectedTenant() {
      this.selectedTenantId = null;
      this.selectedTenantSlug = null;
      this.persistWorkspaceState();
    },

    hydrateSelectedTenantFromAuth(tenant: Pick<Tenant, "id" | "slug"> | null) {
      this.setSelectedTenant(tenant);
    }
  }
});
