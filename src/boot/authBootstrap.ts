import { supabase } from "./supabase";
import { useAuthStore } from "../stores/authStore";
import { bootstrapUserSession } from "../utils/bootstrapUserSession";
import { markIntentionalSignOut } from "./authListener";

export type AuthReadyState = {
  ready: boolean;
  promise: Promise<void>;
};

const authReadyState: AuthReadyState = {
  ready: false,
  promise: Promise.resolve()
};

export function getAuthReadyState() {
  return authReadyState;
}

export default ({ router, store }: { router: any; store: any }) => {
  const authStore = useAuthStore(store);

  authReadyState.promise = (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (session?.user) {
        if (!authStore.isAuthenticated) {
          const result = await bootstrapUserSession(
            session.user.email ?? "",
            session
          );
          if (!result.ok) {
            markIntentionalSignOut();
            authStore.clearAccess();
            await supabase.auth.signOut();
            await router.replace({
              path: "/login",
              query: { error: result.error }
            });
            return;
          }
          if (router.currentRoute.value.path === "/login") {
            await router.replace("/");
          }
        }
        return;
      }

      if (authStore.isAuthenticated) {
        authStore.clearAccess();
        if (router.currentRoute.value.path !== "/login") {
          await router.replace("/login");
        }
      }
    } catch (err) {
      console.error("[authBootstrap] Failed:", err);
    } finally {
      authReadyState.ready = true;
    }
  })();

  return authReadyState.promise;
};
