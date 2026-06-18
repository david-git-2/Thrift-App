<template>
  <q-layout view="hHh lpR fFf" class="theme-app">
    <!-- Header -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title class="text-weight-bold">
          Thrift App
          <span v-if="tenantName" class="text-subtitle2 text-weight-regular text-amber-3 q-ml-sm">
            ({{ tenantName }})
          </span>
        </q-toolbar-title>

        <div v-if="userEmail" class="row items-center q-gutter-sm">
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
    <q-footer class="bg-white text-grey-8" bordered>
      <q-tabs
        v-model="activeTab"
        indicator-color="primary"
        active-color="primary"
        class="text-grey-7"
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

<style scoped>
/* Bottom navigation overrides */
.q-footer {
  border-top: 1px solid #e0e0e0;
}
</style>
