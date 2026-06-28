<template>
  <q-layout view="hHh lpR fFf" class="theme-app">
    <q-header class="app-header text-white">
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

        <div v-if="userEmail" class="app-header__user">
          <q-btn flat round dense class="q-pa-none">
            <q-avatar size="28px" color="white" text-color="primary">
              <img
                v-if="showAvatarImage"
                :src="avatarUrl"
                alt=""
                @error="onAvatarError"
              />
              <q-icon v-else name="person" size="18px" />
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
                    <q-icon name="logout" />
                  </q-item-section>
                  <q-item-section>Sign out</q-item-section>
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

    <q-footer class="app-tabbar text-grey-8">
      <q-tabs
        v-model="activeTab"
        indicator-color="transparent"
        active-color="primary"
        class="text-grey-6"
        align="justify"
      >
        <q-route-tab
          name="insert-stock"
          to="/insert-stock"
          icon="add_box"
          label="Insert Stock"
          no-caps
        />
        <q-route-tab
          name="stock-list"
          to="/stock-list"
          icon="list"
          label="Stock List"
          no-caps
        />
        <q-route-tab
          name="scan-barcode"
          to="/scan-barcode"
          icon="qr_code_scanner"
          label="Scan"
          no-caps
        />
      </q-tabs>
    </q-footer>

    <BarcodeScanOverlay />
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../boot/supabase";
import { APP_VERSION } from "../constants/appVersion";
import BarcodeScanOverlay from "../components/BarcodeScanOverlay.vue";
import BrandMark from "../components/BrandMark.vue";

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref("insert-stock");
const avatarBroken = ref(false);

const tenantName = computed(() => authStore.tenant?.name ?? "");
const userEmail = computed(() => authStore.user?.email ?? "");
const avatarUrl = computed(() => authStore.user?.avatarUrl ?? "");
const showAvatarImage = computed(
  () => Boolean(avatarUrl.value) && !avatarBroken.value
);

const onAvatarError = () => {
  avatarBroken.value = true;
};

const onLogout = async () => {
  authStore.clearAccess();
  await supabase.auth.signOut();
  await router.replace("/login");
};
</script>
