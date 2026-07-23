<template>
  <q-layout view="hHh lpR fFf" class="theme-app">
    <q-header
      class="app-header text-grey-9"
      :class="{ 'app-header--hidden': isNavHidden }"
    >
      <q-toolbar>
        <div class="app-header__brand">
          <div class="app-header__logo-wrap">
            <BrandMark :size="22" use-current-color />
          </div>
          <q-toolbar-title class="q-pl-none">
            <div class="app-header__title">Thrift App</div>
            <div v-if="tenantName" class="app-header__tenant">{{
              tenantName
            }}</div>
          </q-toolbar-title>
        </div>

        <q-btn
          flat
          round
          dense
          icon="ph-regular ph-qr-code"
          to="/scan-barcode"
          class="q-mr-xs text-teal-9 min-tap-target"
        >
          <q-tooltip>{{ $t('scanBarcode.title') }}</q-tooltip>
        </q-btn>

        <!-- Language Switcher Dropdown -->
        <q-btn flat dense no-caps class="q-mr-xs text-teal-9 min-tap-target text-weight-bold q-px-xs">
          <span class="q-mr-xs" style="font-size: 0.85rem">
            {{ localeStore.currentLocale === 'bn' ? 'বাংলা' : 'EN' }}
          </span>
          <q-icon name="ph-regular ph-caret-down" size="18px" />
          <q-tooltip>{{ $t('nav.language') }}</q-tooltip>
          <q-menu anchor="bottom right" self="top right">
            <q-list style="min-width: 140px">
              <q-item
                clickable
                v-close-popup
                :active="localeStore.currentLocale === 'en-US'"
                active-class="bg-teal-1 text-teal-9 text-weight-bold"
                @click="localeStore.setLocale('en-US')"
              >
                <q-item-section avatar style="min-width: 32px">
                  <span class="text-caption text-weight-bold text-teal-9">EN</span>
                </q-item-section>
                <q-item-section>English</q-item-section>
              </q-item>
              <q-item
                clickable
                v-close-popup
                :active="localeStore.currentLocale === 'bn'"
                active-class="bg-teal-1 text-teal-9 text-weight-bold"
                @click="localeStore.setLocale('bn')"
              >
                <q-item-section avatar style="min-width: 32px">
                  <span class="text-caption text-weight-bold text-teal-9">BN</span>
                </q-item-section>
                <q-item-section>বাংলা</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <div v-if="userEmail" class="app-header__user">
          <q-btn flat round dense class="q-pa-none">
            <q-avatar size="28px" color="teal-1" text-color="teal-9">
              <img
                v-if="showAvatarImage"
                :src="avatarUrl"
                alt=""
                @error="onAvatarError"
              />
              <q-icon v-else name="ph-regular ph-user" size="18px" />
            </q-avatar>
            <q-menu anchor="bottom right" self="top right">
              <q-list style="min-width: 200px">
                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{
                      userEmail
                    }}</q-item-label>
                    <q-item-label caption>v{{ APP_VERSION }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="onLogout">
                  <q-item-section avatar>
                    <q-icon name="ph-regular ph-sign-out" />
                  </q-item-section>
                  <q-item-section>{{ $t('nav.signOut') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer
      class="app-tabbar text-grey-8"
      :class="{ 'app-tabbar--hidden': isNavHidden }"
    >
      <q-tabs
        v-model="activeTab"
        indicator-color="transparent"
        active-color="primary"
        class="text-grey-6"
        align="justify"
      >
        <q-route-tab
          name="dashboard"
          to="/"
          icon="ph-duotone ph-squares-four"
          :label="$t('nav.home')"
          no-caps
          exact
        />
        <q-route-tab
          name="scan-barcode"
          to="/scan-barcode"
          icon="ph-duotone ph-qr-code"
          :label="$t('nav.scan')"
          no-caps
        />
        <q-route-tab
          name="insert-stock"
          to="/insert-stock"
          icon="ph-duotone ph-plus-square"
          :label="$t('nav.insert')"
          no-caps
        />
        <q-route-tab
          name="audit-mode"
          to="/audit-mode"
          icon="ph-duotone ph-clipboard-text"
          :label="$t('nav.audit')"
          no-caps
        />
        <q-route-tab
          name="stock-list"
          to="/stock-list"
          icon="ph-duotone ph-package"
          :label="$t('nav.inventory')"
          no-caps
        />
      </q-tabs>
    </q-footer>

    <BarcodeScanOverlay />
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useLocaleStore } from "../stores/localeStore";
import { supabase } from "../boot/supabase";
import { APP_VERSION } from "../constants/appVersion";
import BarcodeScanOverlay from "../components/BarcodeScanOverlay.vue";
import BrandMark from "../components/BrandMark.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const localeStore = useLocaleStore();

const activeTab = ref("dashboard");
const avatarBroken = ref(false);
const isNavHidden = ref(false);

const tenantName = computed(() => authStore.tenant?.name ?? "");
const userEmail = computed(() => authStore.user?.email ?? "");
const avatarUrl = computed(() => authStore.user?.avatarUrl ?? "");
const showAvatarImage = computed(
  () => Boolean(avatarUrl.value) && !avatarBroken.value
);

let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;

const onScroll = () => {
  const currentScrollY = window.scrollY;
  const deltaY = currentScrollY - lastScrollY;
  if (currentScrollY < 50 || deltaY < -5) {
    isNavHidden.value = false;
  } else if (deltaY > 10) {
    isNavHidden.value = true;
  }
  lastScrollY = currentScrollY;
};

const updateActiveTab = (path: string) => {
  if (path.startsWith("/insert-stock") || path.startsWith("/register-stock")) {
    activeTab.value = "insert-stock";
  } else if (path.startsWith("/scan-barcode") || path.startsWith("/scan")) {
    activeTab.value = "scan-barcode";
  } else if (path.startsWith("/audit-mode") || path.startsWith("/audit")) {
    activeTab.value = "audit-mode";
  } else if (path.startsWith("/stock-list") || path.startsWith("/stock/")) {
    activeTab.value = "stock-list";
  } else {
    activeTab.value = "dashboard";
  }
};

watch(
  () => route.path,
  (newPath) => updateActiveTab(newPath),
  { immediate: true }
);

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
});

const onAvatarError = () => {
  avatarBroken.value = true;
};

const onLogout = async () => {
  authStore.clearAccess();
  await supabase.auth.signOut();
  await router.replace("/login");
};
</script>
