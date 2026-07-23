<template>
  <div class="app-root">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { supabase } from "./boot/supabase";
import { getAuthReadyState } from "./boot/authBootstrap";

import { useAuthStore } from "./stores/authStore";

const router = useRouter();
const authStore = useAuthStore();
const THRIFT_TENANT_SLUG = "thrift";

let handledLaunchUrl: string | null = null;

/**
 * Handle incoming deep link URLs from OAuth redirect.
 */
async function handleDeepLink(urlStr: string) {
  try {
    console.log("[handleDeepLink] URL:", urlStr);

    const parsedUrl = new URL(
      urlStr.replace("com.brandwala.thriftapp://", "http://localhost/")
    );

    if (
      !parsedUrl.pathname.includes("auth-callback") &&
      parsedUrl.hostname !== "auth-callback"
    ) {
      return;
    }

    const hash = parsedUrl.hash;
    const searchParams = new URLSearchParams(parsedUrl.search);
    const tenantSlug = searchParams.get("tenant_slug") || "thrift";
    let sessionSet = false;

    if (searchParams.has("code")) {
      const code = searchParams.get("code")!;
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        sessionSet = true;
      } else {
        console.error("[PKCE] Exchange failed:", error.message, error);
      }
    }

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

function isAuthCallbackUrl(url: string) {
  return (
    url.includes("auth-callback") &&
    (url.includes("code=") ||
      url.includes("access_token=") ||
      url.includes("#access_token"))
  );
}

onMounted(async () => {
  // Ensure boot auth finished (router already waited; this is a no-op if ready)
  const ready = getAuthReadyState();
  if (!ready.ready) {
    await ready.promise;
  }

  if (!Capacitor.isNativePlatform()) return;

  document.documentElement.classList.add("plat-native");
  if (Capacitor.getPlatform() === "android") {
    document.documentElement.classList.add("plat-android");
  }

  Browser.addListener("browserFinished", async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session && !authStore.isAuthenticated) {
      await router.replace({
        path: "/auth/callback",
        query: { scope: "app", tenant_slug: THRIFT_TENANT_SLUG }
      });
    }
  });

  const launchUrlResult = await CapApp.getLaunchUrl();
  if (
    launchUrlResult?.url &&
    isAuthCallbackUrl(launchUrlResult.url) &&
    launchUrlResult.url !== handledLaunchUrl
  ) {
    handledLaunchUrl = launchUrlResult.url;
    console.log("[onMounted] Launch URL found:", launchUrlResult.url);
    await handleDeepLink(launchUrlResult.url);
  }

  CapApp.addListener("appUrlOpen", async data => {
    if (!isAuthCallbackUrl(data.url)) return;
    console.log("[appUrlOpen] URL:", data.url);
    await handleDeepLink(data.url);
  });
});
</script>

<style scoped>
.app-root {
  min-height: 100vh;
}
</style>
