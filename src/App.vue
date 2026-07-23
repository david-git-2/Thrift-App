<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { supabase } from "./boot/supabase";

import { useAuthStore } from "./stores/authStore";

const router = useRouter();
const authStore = useAuthStore();
const THRIFT_TENANT_SLUG = "thrift";

/**
 * Handle incoming deep link URLs from OAuth redirect.
 * Supports three token delivery formats:
 *  1. Query params  (Android intent URI): ?access_token=xxx&refresh_token=yyy
 *  2. PKCE code flow:                     ?code=xxx
 *  3. Hash fragment (iOS fallback):       #access_token=xxx&refresh_token=yyy
 */
async function handleDeepLink(urlStr: string) {
  try {
    console.log("[handleDeepLink] URL:", urlStr);

    // Replace custom scheme so URL can be parsed natively by the browser engine
    const parsedUrl = new URL(
      urlStr.replace("com.brandwala.thriftapp://", "http://localhost/")
    );

    if (!parsedUrl.pathname.includes("auth-callback")) return;

    const hash = parsedUrl.hash;
    const searchParams = new URLSearchParams(parsedUrl.search);
    const tenantSlug = searchParams.get("tenant_slug") || "thrift";
    let sessionSet = false;

    // ── 1. PKCE code flow (?code=...) ──────────────────────────────────
    if (searchParams.has("code")) {
      const code = searchParams.get("code")!;
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        sessionSet = true;
      } else {
        console.error("[PKCE] Exchange failed:", error.message, error);
      }
    }

    // ── 2. Query-param tokens (Android intent URI) (?access_token=...) ─
    if (
      !sessionSet &&
      searchParams.has("access_token") &&
      searchParams.has("refresh_token")
    ) {
      const { error } = await supabase.auth.setSession({
        access_token: searchParams.get("access_token")!,
        refresh_token: searchParams.get("refresh_token")!
      });
      if (!error) {
        sessionSet = true;
      } else {
        console.error("[setSession query] Failed:", error.message, error);
      }
    }

    // ── 3. Hash-fragment tokens (iOS fallback) (#access_token=...) ─────
    if (!sessionSet && hash && hash.startsWith("#")) {
      const hashParams = new URLSearchParams(hash.substring(1));
      if (hashParams.has("access_token") && hashParams.has("refresh_token")) {
        const { error } = await supabase.auth.setSession({
          access_token: hashParams.get("access_token")!,
          refresh_token: hashParams.get("refresh_token")!
        });
        if (!error) {
          sessionSet = true;
        } else {
          console.error("[setSession hash] Failed:", error.message, error);
        }
      }
    }

    if (sessionSet) {
      try {
        await Browser.close();
      } catch {
        /* browser may already be closed */
      }
      await router.replace({
        path: "/auth/callback",
        query: { scope: "app", tenant_slug: tenantSlug }
      });
    } else {
      console.warn(
        "[handleDeepLink] No session set. URL had no recognised token params."
      );
    }
  } catch (err) {
    console.error("[handleDeepLink] Error:", err);
  }
}

onMounted(async () => {
  if (!Capacitor.isNativePlatform()) return;

  // ── Listen for Chrome Custom Tab closure ─────────────────────────────
  Browser.addListener("browserFinished", async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session && !authStore.isAuthenticated) {
      await router.replace({
        path: "/auth/callback",
        query: { scope: "app", tenant_slug: THRIFT_TENANT_SLUG }
      });
    }
  });

  // ── CRITICAL: Check for the URL that LAUNCHED the app ─────────────────
  // When the app starts fresh from a deep-link intent, `appUrlOpen` fires
  // before Vue mounts — so the listener below misses it. getLaunchUrl()
  // captures that initial URL and is always available after mount.
  const launchUrlResult = await CapApp.getLaunchUrl();
  if (launchUrlResult?.url) {
    console.log("[onMounted] Launch URL found:", launchUrlResult.url);
    await handleDeepLink(launchUrlResult.url);
  }

  // ── Also listen for deep links when the app is already running ─────────
  CapApp.addListener("appUrlOpen", async data => {
    console.log("[appUrlOpen] URL:", data.url);
    await handleDeepLink(data.url);
  });
});
</script>
