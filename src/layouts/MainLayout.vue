<template>
  <q-layout view="hHh lpR fFf" class="theme-app">
    <!-- Header -->
    <q-header class="app-header text-white">
      <q-toolbar>
        <div class="app-header__brand">
          <div class="app-header__logo-wrap">
            <BrandMark :size="22" use-current-color />
          </div>
          <q-toolbar-title class="q-pl-none">
            <div class="app-header__title">Thrift App</div>
            <div v-if="tenantName" class="app-header__tenant">{{ tenantName }}</div>
          </q-toolbar-title>
        </div>

        <div v-if="userEmail" class="row items-center q-gutter-xs app-header__user">
          <q-avatar size="28px" v-if="avatarUrl">
            <img :src="avatarUrl" />
          </q-avatar>
          <span class="text-caption gt-xs">{{ userEmail }}</span>
          <q-btn flat round dense icon="logout" @click="onLogout">
            <q-tooltip>Sign Out</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Page Content -->
    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Bottom Navigation Tabs (Perfect for Android App Layout) -->
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../boot/supabase'
import BarcodeScanOverlay from '../components/BarcodeScanOverlay.vue'
import BrandMark from '../components/BrandMark.vue'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('insert-stock')

const tenantName = computed(() => authStore.tenant?.name ?? '')
const userEmail = computed(() => authStore.user?.email ?? '')
const avatarUrl = computed(() => authStore.user?.avatarUrl ?? '')

const onLogout = async () => {
  authStore.clearAccess()
  await supabase.auth.signOut()
  await router.replace('/login')
}
</script>

