import { SocialLogin } from "@capgo/capacitor-social-login";
import { Capacitor } from "@capacitor/core";

let initialized = false;

function requireWebClientId(): string {
  const clientId = (
    import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined
  )?.trim();
  if (!clientId) {
    throw new Error(
      "Missing VITE_GOOGLE_WEB_CLIENT_ID. Use the Google Cloud Web client ID (not the Android client ID)."
    );
  }
  return clientId;
}

/** URL-safe random nonce for Supabase + Google ID token binding. */
export function createRawNonce(length = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => (b % 36).toString(36)).join("");
}

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), b =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

export async function ensureGoogleSocialLoginInitialized(): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return;

  await SocialLogin.initialize({
    google: {
      webClientId: requireWebClientId(),
      mode: "online"
    }
  });
  initialized = true;
}

export type NativeGoogleIdTokenResult = {
  idToken: string;
  rawNonce: string;
};

/**
 * Native Google Sign-In (Credential Manager / account picker).
 * Returns ID token + raw nonce for supabase.auth.signInWithIdToken.
 */
export async function loginWithNativeGoogle(): Promise<NativeGoogleIdTokenResult> {
  await ensureGoogleSocialLoginInitialized();

  const rawNonce = createRawNonce();
  const nonceDigest = await sha256Hex(rawNonce);

  const response = await SocialLogin.login({
    provider: "google",
    options: {
      scopes: ["email", "profile"],
      nonce: nonceDigest,
      // Show account picker even if one account is already on device
      style: "bottom",
      filterByAuthorizedAccounts: false
    }
  });

  const result = (response as { result?: Record<string, unknown> })?.result;
  const idToken =
    (result?.idToken as string | undefined) ||
    (result?.id_token as string | undefined);

  if (!idToken) {
    throw new Error("Google Sign-In did not return an ID token");
  }

  return { idToken, rawNonce };
}
