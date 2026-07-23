<template>
  <q-layout view="hHh lpR fFf" class="auth-layout auth-scope--app">
    <q-page-container>
      <q-page class="auth-page">
        <!-- Animated background blobs (left canvas only) -->
        <div class="auth-bg" aria-hidden="true">
          <div class="auth-bg__blob auth-bg__blob--1" />
          <div class="auth-bg__blob auth-bg__blob--2" />
          <div class="auth-bg__blob auth-bg__blob--3" />
        </div>

        <div class="auth-layout__inner">
          <!-- Left: full-bleed dark canvas -->
          <div class="auth-canvas">
            <!-- Brand wordmark — top left -->
            <div class="auth-canvas__brand">
              <div class="auth-canvas__brand-mark" aria-hidden="true">
                <BrandMark :size="24" use-current-color />
              </div>
              <span class="auth-canvas__brand-name">TradeFlowBD</span>
            </div>

            <!-- Giant ghost word — centred vertically -->
            <div class="auth-canvas__ghost-wrap" aria-hidden="true">
              <span class="auth-canvas__ghost-word">Operations</span>
            </div>

            <!-- Bottom tagline -->
            <div class="auth-canvas__footer">
              <p class="auth-canvas__tagline">Run your business.</p>
              <p class="auth-canvas__credit">Powered by TradeFlowBD</p>
            </div>
          </div>

          <!-- Right: login card panel -->
          <div class="auth-panel">
            <section class="auth-card auth-card--app">
              <!-- Top accent bar -->
              <div class="auth-card__accent-bar" aria-hidden="true" />

              <!-- Header -->
              <div class="auth-card__header">
                <h2 class="auth-card__title">{{ $t("auth.loginTitle") }}</h2>
                <p class="auth-card__subtitle">{{ $t("auth.subtitle") }}</p>
              </div>

              <!-- Error banner -->
              <div v-if="errorMessage" class="auth-card__error" role="alert">
                <q-icon
                  name="error_outline"
                  size="1.1rem"
                  class="auth-card__error-icon"
                />
                <span>{{ errorMessage }}</span>
              </div>

              <!-- Divider -->
              <div class="auth-card__divider" aria-hidden="true">
                <span>{{ $t("common.confirm") }}</span>
              </div>

              <!-- Google CTA button -->
              <button
                class="auth-card__cta"
                :class="{ 'auth-card__cta--loading': isLoading }"
                :disabled="isLoading"
                @click="onGoogleLogin"
                type="button"
              >
                <span class="auth-card__cta-inner">
                  <!-- Google 'G' SVG -->
                  <svg
                    v-if="!isLoading"
                    class="auth-card__google-icon"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>

                  <!-- Spinner -->
                  <svg
                    v-else
                    class="auth-card__spinner"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle
                      class="auth-card__spinner-track"
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      stroke-width="2.5"
                    />
                    <path
                      class="auth-card__spinner-arc"
                      d="M12 3a9 9 0 0 1 9 9"
                      fill="none"
                      stroke-width="2.5"
                      stroke-linecap="round"
                    />
                  </svg>

                  <span class="auth-card__cta-label">
                    {{ isLoading ? $t("common.loading") : $t("auth.loginButton") }}
                  </span>
                </span>
              </button>

              <p class="auth-card__secure-note">
                <q-icon
                  name="lock"
                  size="0.85rem"
                  style="vertical-align: -2px"
                />
                {{ $t("auth.subtitle") }}
              </p>
            </section>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useOAuthLogin } from "../composables/useOAuthLogin";
import BrandMark from "../components/BrandMark.vue";

const route = useRoute();
const { handleGoogleLogin, isLoading, loginError } = useOAuthLogin();

const errorMessage = computed(() => {
  const err = loginError.value || route.query.error;
  if (err === "no_membership") {
    return "This account does not have permission for the Thrift workspace.";
  }
  if (err === "invalid_tenant" || err === "no_tenant") {
    return "This account is not allowed for the Thrift tenant workspace.";
  }
  if (err === "membership_failed") {
    return "Failed to verify membership details. Please try again.";
  }
  if (err === "auth_failed") {
    return "Authentication failed. Please try again.";
  }
  if (typeof err === "string" && err.includes("VITE_GOOGLE_WEB_CLIENT_ID")) {
    return "Google Sign-In is not configured. Set VITE_GOOGLE_WEB_CLIENT_ID and rebuild.";
  }
  // Release builds often fail with DEVELOPER_ERROR when the release
  // keystore SHA-1 is missing from Google Cloud Console (Android OAuth client).
  if (
    typeof err === "string" &&
    /DEVELOPER_ERROR|10:|ApiException:\s*10|SHA|certificate/i.test(err)
  ) {
    return "Google Sign-In rejected this build. Register the release keystore SHA-1 as an Android OAuth client in Google Cloud Console (package: com.brandwala.thriftapp), then rebuild.";
  }
  if (typeof err === "string" && err.trim()) {
    return err.trim();
  }
  return "";
});

const onGoogleLogin = () => {
  void handleGoogleLogin();
};
</script>

<style scoped>
/* ── Color palette ────────────────────────── */
.auth-scope--app {
  --auth-bg: #030f08;
  --auth-mid: #052e1a;
  --auth-accent: #10b981;
  --auth-accent-rgb: 16 185 129;
  --auth-glow: rgb(16 185 129 / 0.38);
  --auth-ghost: rgb(16 185 129 / 0.04);
  --auth-card-bar: #059669;
}

.auth-card--app {
  --card-accent: #059669;
  --card-accent-rgb: 5 150 105;
  --card-soft: rgb(5 150 105 / 0.08);
}

/* ── Root layout ─────────────────────────────────────── */
.auth-layout {
  min-height: 100vh;
  background: var(--auth-bg);
  position: relative;
  overflow: hidden;
  /* Safe-area insets are absorbed by .auth-canvas (top) and .auth-panel
     (bottom) so the layout root never shifts and causes a blink. */
}

.auth-page {
  min-height: 100vh;
  min-height: 100dvh;
  padding: 0 !important;
  background: transparent !important;
  max-width: none !important;
}

/* ── Background blobs ────────────────────────────────── */
.auth-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.auth-bg__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  animation: blobFloat 16s ease-in-out infinite alternate;
}

.auth-bg__blob--1 {
  width: 600px;
  height: 600px;
  top: -200px;
  left: -100px;
  background: radial-gradient(circle, var(--auth-accent) 0%, transparent 68%);
  opacity: 0.18;
  animation-delay: 0s;
}

.auth-bg__blob--2 {
  width: 420px;
  height: 420px;
  bottom: -100px;
  left: 20%;
  background: radial-gradient(circle, var(--auth-mid) 0%, transparent 70%);
  opacity: 0.55;
  animation-delay: -6s;
}

.auth-bg__blob--3 {
  width: 300px;
  height: 300px;
  top: 40%;
  left: 30%;
  background: radial-gradient(circle, var(--auth-accent) 0%, transparent 70%);
  opacity: 0.1;
  animation-delay: -11s;
}

@keyframes blobFloat {
  0% {
    transform: translate(0, 0) scale(1);
  }
  40% {
    transform: translate(40px, -50px) scale(1.06);
  }
  70% {
    transform: translate(-25px, 30px) scale(0.96);
  }
  100% {
    transform: translate(15px, -15px) scale(1.03);
  }
}

/* ── Two-column inner ────────────────────────────────── */
.auth-layout__inner {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 420px;
}

/* ── Left canvas ─────────────────────────────────────── */
.auth-canvas {
  position: relative;
  display: flex;
  flex-direction: column;
  /* Top padding absorbs the status-bar safe-area inset on first paint —
     the canvas background is fixed so there is no layout-shift blink. */
  padding: clamp(1.75rem, 3.5vw, 2.75rem);
  padding-top: calc(clamp(1.75rem, 3.5vw, 2.75rem) + env(safe-area-inset-top, 24px));
  overflow: hidden;
  background-image:
    linear-gradient(rgb(255 255 255 / 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  border-right: 1px solid rgb(255 255 255 / 0.05);
}

.auth-canvas::after {
  content: "";
  position: absolute;
  top: 5%;
  right: -1px;
  width: 1px;
  height: 90%;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--auth-glow) 40%,
    var(--auth-glow) 60%,
    transparent 100%
  );
}

.auth-canvas__brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--auth-accent);
  flex-shrink: 0;
}

.auth-canvas__brand-mark {
  display: flex;
  align-items: center;
  color: var(--auth-accent);
}

.auth-canvas__brand-name {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.65);
}

.auth-canvas__ghost-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  margin-left: -0.05em;
  pointer-events: none;
  user-select: none;
}

.auth-canvas__ghost-word {
  font-size: clamp(7rem, 16vw, 16rem);
  font-weight: 900;
  line-height: 0.85;
  letter-spacing: -0.06em;
  color: transparent;
  -webkit-text-stroke: 1px rgb(255 255 255 / 0.07);
  background: linear-gradient(
    160deg,
    rgb(255 255 255 / 0.06) 0%,
    var(--auth-ghost) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
}

.auth-canvas__footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.auth-canvas__tagline {
  margin: 0;
  font-size: clamp(0.95rem, 1.6vw, 1.15rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: rgb(255 255 255 / 0.7);
}

.auth-canvas__credit {
  margin: 0;
  font-size: 0.68rem;
  color: rgb(255 255 255 / 0.2);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* ── Right panel (login card) ────────────────────────── */
.auth-panel {
  display: grid;
  align-content: center;
  background: #ffffff;
  padding: clamp(1.75rem, 4vw, 3rem) clamp(1.5rem, 3.5vw, 2.5rem);
  padding-bottom: calc(clamp(1.75rem, 4vw, 3rem) + env(safe-area-inset-bottom, 0px));
  box-shadow: -24px 0 80px rgb(0 0 0 / 0.45);
}

/* ── Card Shell ────────────────────────── */
.auth-card {
  background: #ffffff;
  border-radius: 1.25rem;
  border: 1px solid #f0ede8;
  box-shadow:
    0 2px 4px rgb(0 0 0 / 0.04),
    0 8px 24px rgb(0 0 0 / 0.08),
    0 24px 48px rgb(0 0 0 / 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 0 0 1.75rem;
  transition: box-shadow 0.3s ease;
  width: 100%;
}

.auth-card:hover {
  box-shadow:
    0 2px 4px rgb(0 0 0 / 0.04),
    0 12px 32px rgb(0 0 0 / 0.11),
    0 28px 56px rgb(0 0 0 / 0.07);
}

.auth-card__accent-bar {
  height: 4px;
  background: linear-gradient(
    90deg,
    var(--card-accent) 0%,
    color-mix(in srgb, var(--card-accent) 60%, #fff) 100%
  );
}

.auth-card__header {
  padding: 1.5rem 1.75rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.auth-card__title {
  margin: 0;
  font-size: clamp(1.45rem, 3vw, 1.85rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.05;
  color: #0e0d0c;
}

.auth-card__subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #6b6560;
  letter-spacing: 0.005em;
}

.auth-card__error {
  margin: 0 1.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.65rem;
  background: rgb(220 38 38 / 0.06);
  border: 1px solid rgb(220 38 38 / 0.18);
  color: #991b1b;
  font-size: 0.83rem;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.auth-card__error-icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: #dc2626;
}

.auth-card__divider {
  margin: 0 1.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #b0a99e;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.auth-card__divider::before,
.auth-card__divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #ede9e3;
}

.auth-card__cta {
  appearance: none;
  cursor: pointer;
  border: 1.5px solid #e5e1da;
  background: #fafaf8;
  border-radius: 0.85rem;
  margin: 0 1.75rem;
  padding: 0.9rem 1rem;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.12s ease;
  outline: none;
}

.auth-card__cta:hover:not(:disabled) {
  background: #ffffff;
  border-color: #c8c3bb;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.08);
  transform: translateY(-1px);
}

.auth-card__cta:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none;
}

.auth-card__cta:focus-visible {
  border-color: var(--card-accent);
  box-shadow: 0 0 0 3px var(--card-soft);
}

.auth-card__cta:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.auth-card__cta--loading {
  pointer-events: none;
}

.auth-card__cta-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.auth-card__google-icon {
  width: 1.2rem;
  height: 1.2rem;
  flex-shrink: 0;
}

.auth-card__cta-label {
  font-size: 0.93rem;
  font-weight: 600;
  color: #2c2924;
  letter-spacing: 0.01em;
}

.auth-card__spinner {
  width: 1.2rem;
  height: 1.2rem;
  animation: spin 0.85s linear infinite;
  flex-shrink: 0;
}

.auth-card__spinner-track {
  stroke: #e5e0d8;
}

.auth-card__spinner-arc {
  stroke: var(--card-accent);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-card__secure-note {
  margin: 0 1.75rem;
  font-size: 0.72rem;
  color: #a8a19a;
  line-height: 1.45;
  text-align: center;
}

/* ── Responsive: collapse to single column ───────────── */
@media (max-width: 860px) {
  .auth-layout__inner {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .auth-canvas {
    min-height: unset;
    border-right: none;
    border-bottom: 1px solid rgb(255 255 255 / 0.05);
    padding: clamp(1.25rem, 3vw, 1.75rem);
  }

  .auth-canvas::after {
    display: none;
  }

  .auth-canvas__ghost-wrap {
    min-height: 6rem;
    flex: unset;
  }

  .auth-canvas__ghost-word {
    font-size: clamp(4rem, 18vw, 7rem);
  }

  .auth-panel {
    padding: clamp(1.5rem, 5vw, 2.25rem);
    box-shadow: none;
  }
}

@media (max-width: 480px) {
  .auth-canvas {
    padding: 1.25rem;
  }

  .auth-canvas__ghost-wrap {
    min-height: 4rem;
  }

  .auth-panel {
    padding: 1.25rem;
  }
}
</style>
