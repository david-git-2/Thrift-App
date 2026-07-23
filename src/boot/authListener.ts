import { Notify } from "quasar";
import { supabase } from "./supabase";
import { useAuthStore } from "../stores/authStore";

export default ({ router, store }: { router: any; store: any }) => {
  supabase.auth.onAuthStateChange((event: string) => {
    if (event === "SIGNED_OUT") {
      const authStore = useAuthStore(store);
      authStore.clearAccess();
      Notify.create({
        type: "warning",
        message: "Your session has expired. Please log in again.",
        position: "top",
        timeout: 4000
      });
      void router.replace("/login");
    }
  });
};
