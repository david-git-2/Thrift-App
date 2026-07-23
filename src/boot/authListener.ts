import { Notify } from "quasar";
import { supabase } from "./supabase";
import { useAuthStore } from "../stores/authStore";

/** Skip expiry toast/redirect when signOut is intentional (failed membership, logout button, etc.). */
let suppressAuthExpiryNotify = false;

export function markIntentionalSignOut() {
  suppressAuthExpiryNotify = true;
}

export default ({ router, store }: { router: any; store: any }) => {
  supabase.auth.onAuthStateChange((event: string) => {
    if (event !== "SIGNED_OUT") return;

    const authStore = useAuthStore(store);
    const wasAuthenticated = authStore.isAuthenticated;
    authStore.clearAccess();

    if (suppressAuthExpiryNotify) {
      suppressAuthExpiryNotify = false;
      return;
    }

    const path = router.currentRoute.value?.path;
    if (path === "/login" || path === "/auth/callback") {
      return;
    }

    if (wasAuthenticated) {
      Notify.create({
        type: "warning",
        message: "Your session has expired. Please log in again.",
        position: "top",
        timeout: 4000
      });
    }

    void router.replace("/login");
  });
};
