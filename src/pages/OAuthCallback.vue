<template>
  <div class="callback-stage">
    <div class="callback-card">
      <template v-if="isRedirectingToApp">
        <PageInitialLoader compact message="Opening Thrift App..." />
        <div class="text-subtitle2 text-grey-6 q-mt-sm">
          You are being redirected back to the Thrift application.
        </div>

        <div v-if="appRedirectUrl" class="q-mt-lg">
          <q-btn
            color="primary"
            unelevated
            no-caps
            class="q-px-lg q-py-sm font-semibold"
            :href="appRedirectUrl"
            label="Open Thrift App Manually"
          />
          <div class="text-caption text-grey-6 q-mt-sm">
            If the app didn't open automatically, click the button above.
          </div>
        </div>
      </template>

      <template v-else>
        <PageInitialLoader
          compact
          message="Verifying your access credentials and loading the thrift workspace..."
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useOAuthLogin } from "../composables/useOAuthLogin";
import { supabase } from "../boot/supabase";
import PageInitialLoader from "../components/PageInitialLoader.vue";
import { Capacitor } from "@capacitor/core";

const { processLoginResult } = useOAuthLogin();

const isRedirectingToApp = ref(false);
const appRedirectUrl = ref("");

function buildNativeAppRedirect(params: URLSearchParams) {
  const query = params.toString();
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isAndroid) {
    return `intent://auth-callback?${query}#Intent;scheme=com.brandwala.thriftapp;package=com.brandwala.thriftapp;end`;
  }
  return `com.brandwala.thriftapp://auth-callback?${query}`;
}

onMounted(async () => {
  const searchParams = new URLSearchParams(window.location.search);
  const isAppScope =
    searchParams.get("scope") === "app" ||
    searchParams.get("app_redirect") === "thrift";

  if (isAppScope && !Capacitor.isNativePlatform()) {
    isRedirectingToApp.value = true;

    const tenantSlug = searchParams.get("tenant_slug") || "thrift";

    // ── PKCE code passthrough ──────────────────────────────────────────
    // Native app stores code_verifier in its WebView. Do NOT exchange here.
    const code = searchParams.get("code");
    if (code) {
      const deepLinkParams = new URLSearchParams({
        code,
        scope: "app",
        tenant_slug: tenantSlug
      });
      appRedirectUrl.value = buildNativeAppRedirect(deepLinkParams);
      window.location.href = appRedirectUrl.value;
      return;
    }

    // Fallback: session already present → pass tokens
    let session = null;
    for (let i = 0; i < 60; i++) {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        session = data.session;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (session?.access_token && session.refresh_token) {
      const deepLinkParams = new URLSearchParams({
        scope: "app",
        tenant_slug: tenantSlug,
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
      appRedirectUrl.value = buildNativeAppRedirect(deepLinkParams);
      window.location.href = appRedirectUrl.value;
      return;
    }
  }

  void processLoginResult();
});
</script>

<style scoped>
.callback-stage {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #030f08;
  padding: 1rem;
}

.callback-card {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  border-radius: 16px;
  background: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  text-align: center;
}
</style>
