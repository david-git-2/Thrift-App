import { ref } from "vue";
import { useRouter } from "vue-router";
import { Capacitor } from "@capacitor/core";
import { supabase } from "../boot/supabase";
import { useAuthStore } from "../stores/authStore";
import { markIntentionalSignOut } from "../boot/authListener";
import { bootstrapUserSession } from "../utils/bootstrapUserSession";
import { loginWithNativeGoogle } from "../utils/nativeGoogleAuth";

import { THRIFT_TENANT_SLUG } from "../constants/thriftTenant";

export { THRIFT_TENANT_SLUG };

function oauthRedirectTo(): string {
  const callbackSearchParams = new URLSearchParams({
    scope: "app",
    tenant_slug: THRIFT_TENANT_SLUG
  });
  return `${window.location.origin}/#/auth/callback?${callbackSearchParams.toString()}`;
}

function googleLoginErrorMessage(err: unknown): string {
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: unknown }).message ?? "")
      : typeof err === "string"
        ? err
        : "";
  if (message.trim()) return message.trim();
  return "auth_failed";
}

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

  /**
   * Android/iOS: native Google account picker → ID token → Supabase session.
   * Web: Supabase OAuth redirect in the browser.
   */
  const handleGoogleLogin = async () => {
    isLoading.value = true;
    loginError.value = null;
    try {
      if (Capacitor.isNativePlatform()) {
        const { idToken, rawNonce } = await loginWithNativeGoogle();
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
          nonce: rawNonce
        });
        if (error) throw error;
        if (!data.session) throw new Error("auth_failed");
        return await completeSessionBootstrap(
          data.session.user.email ?? "",
          data.session
        );
      }

      const redirectTo = oauthRedirectTo();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true
        }
      });
      if (error) throw error;
      if (!data.url) throw new Error("No OAuth URL returned from Supabase");

      window.location.assign(data.url);
      return true;
    } catch (err: unknown) {
      console.error("Google OAuth error", err);
      loginError.value = googleLoginErrorMessage(err);
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
