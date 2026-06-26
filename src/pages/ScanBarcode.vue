<template>
  <q-page class="bw-page theme-app">
    <div class="bw-page__stack">
      <AppPageHeader title="Scan" />

      <q-card class="app-card q-pa-md">
        <div class="text-center q-gutter-y-sm">
          <q-btn
            color="primary"
            unelevated
            icon="qr_code_scanner"
            label="Scan Barcode"
            size="md"
            class="full-width app-cta-btn"
            no-caps
            @click="startScan"
          />

          <div class="row items-center q-my-sm">
            <div class="col" style="height: 1px; background: rgb(var(--bw-theme-primary-rgb) / 0.12);" />
            <div class="col-auto q-px-sm text-caption text-grey-6">or enter manually</div>
            <div class="col" style="height: 1px; background: rgb(var(--bw-theme-primary-rgb) / 0.12);" />
          </div>

          <div class="row q-col-gutter-xs">
            <div class="col">
              <q-input
                v-model="manualBarcode"
                outlined
                dense
                placeholder="Enter barcode..."
                @keyup.enter="lookupBarcode(manualBarcode)"
              />
            </div>
            <div class="col-auto">
              <q-btn
                color="primary"
                icon="search"
                class="full-height"
                @click="lookupBarcode(manualBarcode)"
                :disabled="!manualBarcode.trim()"
              />
            </div>
          </div>
        </div>
      </q-card>

      <PageInitialLoader v-if="searching" compact message="Looking up..." />

      <div v-else-if="scannedItem" class="q-mt-sm">
        <q-card class="app-card overflow-hidden">
          <div class="relative-position">
            <div class="scan-hero-image">
              <SmartImage
                :src="scannedItem.image_url"
                :alt="scannedItem.name || scannedItem.brand_name || scannedItem.barcode || 'Product image'"
                img-class="scan-hero-image__img"
              />
            </div>
            <q-chip
              dense
              :color="getStatusColor(scannedItem.status)"
              text-color="white"
              class="absolute-top-left q-ma-sm text-uppercase text-weight-bold"
            >
              {{ scannedItem.status }}
            </q-chip>
          </div>

          <q-card-section class="q-pa-md">
            <div class="row items-center q-gutter-xs q-mb-xs">
              <span class="text-caption text-weight-bold text-primary text-uppercase">
                {{ scannedItem.brand_name || 'Generic' }}
              </span>
              <q-chip dense outline size="sm" class="q-ma-none">
                {{ formatCondition(scannedItem.condition) }}
              </q-chip>
            </div>

            <div class="text-h6 text-weight-bold text-grey-9 line-height-sm">
              {{ scannedItem.name || scannedItem.brand_name || scannedItem.barcode }}
            </div>

            <div class="row items-center q-gutter-xs text-caption text-grey-6 q-mt-xs">
              <span v-if="scannedItem.color">{{ scannedItem.color }}</span>
              <span v-if="scannedItem.color && scannedItem.size">·</span>
              <span v-if="scannedItem.size">Sz {{ scannedItem.size }}</span>
            </div>

            <div
              class="row items-center bg-grey-1 rounded-borders q-px-sm q-py-xs q-mt-sm cursor-pointer"
              @click="copyBarcode(scannedItem.barcode)"
            >
              <q-icon name="qr_code" size="14px" color="grey-6" class="q-mr-xs" />
              <span class="text-caption text-mono text-grey-8 col">{{ scannedItem.barcode }}</span>
              <q-icon name="content_copy" size="12px" color="grey-6" />
            </div>

            <div class="row q-col-gutter-sm q-mt-md">
              <div class="col-4">
                <div class="scan-price-tile">
                  <div class="text-caption text-grey-6">Listed</div>
                  <div class="text-subtitle2 text-weight-bold">{{ formatPrice(scannedItem.listed_price) }}</div>
                </div>
              </div>
              <div class="col-4">
                <div class="scan-price-tile">
                  <div class="text-caption text-grey-6">Cost</div>
                  <div class="text-subtitle2 text-weight-bold">{{ formatPrice(scannedItem.cost_of_goods_sold) }}</div>
                </div>
              </div>
              <div class="col-4">
                <div class="scan-price-tile">
                  <div class="text-caption text-grey-6">Target</div>
                  <div class="text-subtitle2 text-weight-bold">{{ formatPrice(scannedItem.target_price) }}</div>
                </div>
              </div>
            </div>

            <div class="q-mt-md q-gutter-y-xs text-body2 text-grey-8">
              <div class="row items-center no-wrap">
                <q-icon name="local_shipping" size="16px" color="grey-6" class="q-mr-sm" />
                <span class="ellipsis">
                  {{ scannedItem.shipment_name || 'Unknown shipment' }}
                  <span v-if="scannedItem.box_name" class="text-grey-6"> · {{ scannedItem.box_name }}</span>
                </span>
              </div>
              <div class="row items-center no-wrap">
                <q-icon name="layers" size="16px" color="grey-6" class="q-mr-sm" />
                <span>{{ scannedItem.shelf_code || 'No shelf' }}</span>
              </div>
              <div
                v-if="scannedItem.product_weight || scannedItem.note"
                class="row items-start no-wrap"
              >
                <q-icon name="scale" size="16px" color="grey-6" class="q-mr-sm q-mt-xs" />
                <span>
                  <span v-if="scannedItem.product_weight">{{ scannedItem.product_weight }}g</span>
                  <span v-if="scannedItem.note" class="text-grey-6"> — {{ scannedItem.note }}</span>
                </span>
              </div>
            </div>

            <div class="row q-gutter-sm q-mt-md">
              <q-btn
                color="primary"
                unelevated
                no-caps
                class="col app-cta-btn"
                label="View & Edit"
                icon="edit"
                @click="goToStockDetail"
              />
              <q-btn
                flat
                color="grey-7"
                no-caps
                class="col"
                label="Scan again"
                icon="refresh"
                @click="clearResult"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div v-else-if="searchedBarcode" class="app-empty-state q-mt-md">
        <div class="app-empty-state__icon" style="background: rgb(245 158 11 / 0.12); color: #d97706;">
          <q-icon name="warning" size="2rem" />
        </div>
        <div class="text-subtitle1 text-weight-bold text-grey-8">Not found</div>
        <p class="text-caption text-grey-6 q-mt-xs text-mono">{{ searchedBarcode }}</p>
        <div class="q-mt-md row justify-center q-gutter-sm">
          <q-btn color="primary" label="Register item" no-caps @click="goToRegisterStock" />
          <q-btn flat color="grey-7" label="Try again" no-caps @click="clearResult" />
        </div>
      </div>

      <div v-else class="text-center q-py-lg text-grey-5">
        <q-icon name="qr_code_scanner" size="3rem" color="grey-3" class="q-mb-sm" />
        <div class="text-body2">Scan or enter a barcode</div>
      </div>

      <q-dialog v-model="showSimDialog" persistent>
        <q-card style="min-width: 300px;" class="rounded-borders">
          <q-card-section class="q-gutter-y-md">
            <div class="text-subtitle1 text-weight-bold">Enter barcode</div>
            <q-input
              v-model="simulatedBarcode"
              outlined
              dense
              placeholder="e.g. BC-1-2-12345"
              autofocus
              @keyup.enter="confirmSimulatedScan"
            />
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" color="grey-7" no-caps v-close-popup />
            <q-btn
              label="Search"
              color="primary"
              no-caps
              :disabled="!simulatedBarcode.trim()"
              @click="confirmSimulatedScan"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from '../boot/supabase'
import { useAuthStore } from '../stores/authStore'
import { useThriftStore } from '../stores/thriftStore'
import { Capacitor } from '@capacitor/core'
import { useBarcodeScan } from '../composables/useBarcodeScan'
import { normalizeScannedBarcode } from '../utils/normalizeScannedBarcode'
import { buildBarcodeCandidates } from '../utils/barcodeCandidates'
import { useThriftCurrencyStore } from '../stores/thriftCurrencyStore'
import { refreshShipmentCurrencyIds } from '../composables/useThriftShipment'
import { fetchThriftStockByBarcode } from '../composables/useThriftStockDetail'
import { formatThriftAmount } from '../utils/formatThriftAmount'
import PageInitialLoader from '../components/PageInitialLoader.vue'
import AppPageHeader from '../components/AppPageHeader.vue'
import SmartImage from '../components/SmartImage.vue'

interface ScannedStockItem {
  id: number
  shipment_id: number
  name: string | null
  brand_name: string | null
  color: string | null
  size: string | null
  condition: string | null
  barcode: string | null
  status: string
  product_weight: number | null
  extra_weight: number | null
  note: string | null
  cost_of_goods_sold: number
  target_price: number
  listed_price: number
  image_url: string
  shelf_code: string
  shelf_name: string
  shipment_name: string
  box_name: string
}

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const currencyStore = useThriftCurrencyStore()
const thriftStore = useThriftStore()
const { scanBarcode } = useBarcodeScan()

const manualBarcode = ref('')
const searching = ref(false)
const scannedItem = ref<ScannedStockItem | null>(null)
const searchedBarcode = ref('')
const shipmentCostCurrencyId = ref<number | null>(null)

const showSimDialog = ref(false)
const simulatedBarcode = ref('')

const costCurrency = computed(() =>
  currencyStore.currencyById(shipmentCostCurrencyId.value ?? authStore.thriftDefaultCostCurrencyId),
)

const formatPrice = (amount: number) => formatThriftAmount(amount, costCurrency.value)

onMounted(() => {
  void currencyStore.loadCurrencies()
})

const startScan = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const barcodeVal = await scanBarcode()
      if (barcodeVal) {
        lookupBarcode(barcodeVal)
      }
    } catch (err) {
      console.error('Barcode scanning error:', err)
      const message = err instanceof Error ? err.message : 'Scanning error'
      $q.notify({ type: 'warning', message: `${message}. Enter barcode manually.` })
    }
  } else {
    simulatedBarcode.value = ''
    showSimDialog.value = true
  }
}

const confirmSimulatedScan = () => {
  showSimDialog.value = false
  if (simulatedBarcode.value.trim()) {
    lookupBarcode(simulatedBarcode.value.trim())
  }
}

const lookupBarcode = async (barcodeVal: string) => {
  const tenantId = authStore.tenantId
  if (!tenantId) {
    $q.notify({ type: 'negative', message: 'Session expired' })
    return
  }

  if (!barcodeVal.trim()) return

  const normalized = normalizeScannedBarcode(barcodeVal)
  if (!normalized) return

  searching.value = true
  scannedItem.value = null
  searchedBarcode.value = normalized
  shipmentCostCurrencyId.value = null

  try {
    let lookupBarcodeValue = normalized

    try {
      const { data: resolved, error: resolveError } = await supabase.rpc('resolve_thrift_barcode', {
        p_tenant_id: tenantId,
        p_scanned_value: normalized,
      })
      if (resolveError) throw resolveError

      const match = Array.isArray(resolved) ? resolved[0] : null
      if (match?.barcode_id) {
        lookupBarcodeValue = match.barcode_id
        searchedBarcode.value = lookupBarcodeValue
      }
    } catch (resolveErr) {
      console.warn('resolve_thrift_barcode failed, using direct lookup:', resolveErr)
      for (const candidate of buildBarcodeCandidates(tenantId, normalized)) {
        const { data, error } = await supabase
          .from('thrift_barcodes')
          .select('barcode_id')
          .eq('tenant_id', tenantId)
          .eq('barcode_id', candidate)
          .maybeSingle()
        if (error) throw error
        if (data?.barcode_id) {
          lookupBarcodeValue = data.barcode_id
          searchedBarcode.value = lookupBarcodeValue
          break
        }
      }
    }

    const detail = await fetchThriftStockByBarcode(tenantId, lookupBarcodeValue)

    if (detail) {
      const shipmentRow = await refreshShipmentCurrencyIds(detail.shipment_id, tenantId)
      shipmentCostCurrencyId.value = shipmentRow?.cost_currency_id ?? null

      scannedItem.value = {
        id: detail.id,
        shipment_id: detail.shipment_id,
        name: detail.name,
        brand_name: detail.brand_name,
        color: detail.color,
        size: detail.size,
        condition: detail.condition,
        barcode: detail.barcode,
        status: detail.status,
        product_weight: detail.product_weight,
        extra_weight: detail.extra_weight,
        note: detail.note,
        cost_of_goods_sold: detail.cost_of_goods_sold,
        target_price: detail.target_price,
        listed_price: detail.listed_price,
        image_url: detail.image_url,
        shelf_code: detail.shelf_code,
        shelf_name: detail.shelf_name,
        shipment_name: detail.shipment_name,
        box_name: detail.box_name,
      }
    } else {
      scannedItem.value = null
    }
  } catch (err: unknown) {
    console.error('Lookup barcode error:', err)
    const message = err instanceof Error ? err.message : 'Lookup failed'
    $q.notify({ type: 'negative', message })
  } finally {
    searching.value = false
  }
}

const clearResult = () => {
  scannedItem.value = null
  searchedBarcode.value = ''
  manualBarcode.value = ''
  shipmentCostCurrencyId.value = null
}

const goToRegisterStock = () => {
  if (searchedBarcode.value) {
    thriftStore.setTempBarcode(searchedBarcode.value)
  }
  router.push('/register-stock')
}

const goToStockDetail = () => {
  if (scannedItem.value?.id) {
    router.push({ name: 'stock-detail', params: { id: scannedItem.value.id } })
  }
}

const copyBarcode = (barcode: string | null) => {
  if (!barcode) return
  navigator.clipboard.writeText(barcode)
  $q.notify({ type: 'positive', message: 'Barcode copied', timeout: 1000 })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE':
      return 'positive'
    case 'OUT_OF_STOCK':
      return 'grey-6'
    case 'DAMAGED':
      return 'warning'
    case 'STOLEN':
      return 'negative'
    default:
      return 'primary'
  }
}

const formatCondition = (cond: string | null) => cond?.replace(/_/g, ' ') || ''
</script>

<style scoped>
.scan-hero-image {
  aspect-ratio: 4 / 3;
  background: #f5f5f5;
}

.scan-hero-image__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan-price-tile {
  background: rgb(var(--bw-theme-primary-rgb) / 0.06);
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}

.line-height-sm {
  line-height: 1.2;
}
</style>
