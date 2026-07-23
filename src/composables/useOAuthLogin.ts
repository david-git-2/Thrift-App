import { ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../boot/supabase";
import { useAuthStore } from "../stores/authStore";
import { Capacitor } from "@capacitor/core";
import { markIntentionalSignOut } from "../boot/authListener";
import { bootstrapUserSession } from "../utils/bootstrapUserSession";
import { loginWithNativeGoogle } from "../utils/nativeGoogleAuth";

import { THRIFT_TENANT_SLUG } from "../constants/thriftTenant";

export { THRIFT_TENANT_SLUG };

export function useOAuthLogin() {
  const router = useRouter();
  const authStore = useAuthStore();
  const isLoading = ref(false);
  /** Local error for login UI — avoids router.replace remount flicker */
  const loginError = ref<string | null>(null);

  const sendBackToLogin = async (errorKey: string) => {
    markIntentionalSignOut();
    authStore.clearAccess();
    await supabase.auth.signOut();
    loginError.value = errorKey;
    await router.replace({ path: "/login", query: { error: errorKey } });
  };

  const completeSessionBootstrap = async (userEmail: string, session: any) => {
    const result = await bootstrapUserSession(userEmail, session);
    if (!result.ok) {
      await sendBackToLogin(result.error);
      return false;
    }
    loginError.value = null;
    await router.replace("/");
    return true;
  };

  // 1. Google login — native ID token first, Browser OAuth fallback on Android
  const handleGoogleLogin = async () => {
    isLoading.value = true;
    loginError.value = null;
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          const { idToken, rawNonce } = await loginWithNativeGoogle();
          let session = null;

          const withNonce = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: idToken,
            nonce: rawNonce
          });

          if (withNonce.error) {
            // Some Google responses omit nonce claim — retry without nonce
            console.warn(
              "[Google] signInWithIdToken with nonce failed, retrying without:",
              withNonce.error.message
            );
            const withoutNonce = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: idToken
            });
            if (withoutNonce.error) throw withoutNonce.error;
            session = withoutNonce.data.session;
          } else {
            session = withNonce.data.session;
          }

          if (session) {
            return await completeSessionBootstrap(
              session.user.email ?? "",
              session
            );
          }
          throw new Error("No session returned from Google Sign-In");
        } catch (nativeErr: any) {
          const msg = String(nativeErr?.message ?? nativeErr ?? "");
          // User cancelled account picker — silent exit
          if (
            /cancel|cancelled|canceled|user_cancelled|USER_CANCELLED/i.test(msg)
          ) {
            return false;
          }
          console.error("[Google] Native Sign-In failed:", msg);
          loginError.value = msg || "auth_failed";
          return false;
        }
      }

      const callbackSearchParams = new URLSearchParams({
        scope: "app",
        tenant_slug: THRIFT_TENANT_SLUG
      });
      const redirectTo = `${window.location.origin}/#/auth/callback?${callbackSearchParams.toString()}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo }
      });
      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error("Google OAuth error", err);
      loginError.value =
        typeof err?.message === "string" && err.message.trim()
          ? err.message
          : "auth_failed";
      return false;
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
        return await completeSessionBootstrap(
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
          shouldCreateUser: false
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
        return await completeSessionBootstrap(
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

  // Backwards compatible method for callback page (web / bridge OAuth)
  const processLoginResult = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session?.user) {
        await router.replace("/login");
        return false;
      }

      return await completeSessionBootstrap(session.user.email ?? "", session);
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
    isLoading,
    loginError
  };
}
