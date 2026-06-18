<template>
  <div class="callback-stage">
    <div class="callback-card">
      <template v-if="isRedirectingToApp">
        <q-spinner-tail color="primary" size="48px" />
        <div class="text-h6 q-mt-md text-weight-bold">Opening Thrift App...</div>
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
        <q-spinner-tail color="primary" size="48px" />
        <div class="text-h6 q-mt-md text-weight-bold">Finishing sign-in</div>
        <div class="text-subtitle2 text-grey-6 q-mt-sm">
          Verifying your access credentials and loading the thrift workspace...
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useOAuthLogin } from '../composables/useOAuthLogin'
import { supabase } from '../boot/supabase'
import { Capacitor } from '@capacitor/core'

const { processLoginResult } = useOAuthLogin()

const isRedirectingToApp = ref(false)
const appRedirectUrl = ref('')

onMounted(async () => {
  // Check if we are running in system browser (web) but user logged in via native app trigger
  const searchParams = new URLSearchParams(window.location.search)
  const isAppScope = searchParams.get('scope') === 'app'
  
  if (isAppScope && !Capacitor.isNativePlatform()) {
    isRedirectingToApp.value = true
    
    // Poll for the session to be established by Supabase's automatic PKCE/hash exchange
    let session = null
    for (let i = 0; i < 30; i++) {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        session = data.session
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    
    if (session) {
      const tenantSlug = searchParams.get('tenant_slug') || 'thrift'
      const accessToken = session.access_token
      const refreshToken = session.refresh_token
      
      if (accessToken && refreshToken) {
        const isAndroid = /Android/i.test(navigator.userAgent)
        if (isAndroid) {
          // IMPORTANT: Android intent URIs only support ONE # (for the #Intent;...;end block).
          // Tokens MUST be in query params, not a hash fragment.
          appRedirectUrl.value = `intent://auth-callback?scope=app&tenant_slug=${tenantSlug}&access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}#Intent;scheme=com.brandwala.thriftapp;package=com.brandwala.thriftapp;end`
        } else {
          // Standard custom scheme for iOS — tokens in query params for consistency
          appRedirectUrl.value = `com.brandwala.thriftapp://auth-callback?scope=app&tenant_slug=${tenantSlug}&access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`
        }
        // Trigger client-side scheme redirect
        window.location.href = appRedirectUrl.value
        return
      }
    }
  }

  // Fallback to local session bootstrap (if native app, or regular web user)
  void processLoginResult()
})
</script>

<style scoped>
.callback-stage {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5ece2;
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
