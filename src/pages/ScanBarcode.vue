<template>
  <q-page class="bw-page bg-grey-1 theme-app">
    <div class="bw-page__stack">
      <!-- Header -->
      <div class="text-center q-my-sm">
        <h1 class="text-h5 text-weight-bold text-grey-9 q-my-none">Scan Lookup</h1>
        <p class="text-caption text-grey-6 q-my-none">Scan any stock barcode to view its details instantly.</p>
      </div>

      <!-- Action Panel (Start Scan or Input) -->
      <div class="row q-col-gutter-md">
        <div class="col-12 text-center q-gutter-y-sm">
          <q-btn
            color="primary"
            icon="qr_code_scanner"
            label="Scan Barcode"
            size="lg"
            class="full-width q-py-md text-weight-bold"
            no-caps
            @click="startScan"
          />

          <div class="row items-center q-my-sm">
            <div class="col bg-grey-4" style="height: 1px;"></div>
            <div class="col-auto q-px-sm text-caption text-grey-5 text-weight-bold text-uppercase">OR ENTER MANUALLY</div>
            <div class="col bg-grey-4" style="height: 1px;"></div>
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
      </div>

      <!-- Loading State -->
      <div v-if="searching" class="flex flex-center q-py-xl">
        <q-spinner-dots size="40px" color="primary" />
      </div>

      <!-- Lookup Result Card -->
      <div v-else-if="scannedItem" class="q-mt-md">
        <q-card class="shadow-1 rounded-borders overflow-hidden">
          <!-- Card Header / Title -->
          <q-card-section class="bg-primary text-white q-py-md">
            <div class="row items-center justify-between">
              <div class="row items-center">
                <q-icon name="qr_code" size="sm" class="q-mr-sm" />
                <div>
                  <div class="text-caption text-amber-3 text-weight-bold text-uppercase letter-spacing-xs">Barcode Found</div>
                  <div class="text-subtitle2 text-weight-mono text-white">{{ scannedItem.barcode }}</div>
                </div>
              </div>
              <q-btn flat round color="white" icon="close" size="sm" @click="clearResult" />
            </div>
          </q-card-section>

          <!-- Main Info Section -->
          <div class="row no-wrap items-stretch border-bottom-light">
            <!-- Product Image -->
            <div class="col-5 flex flex-center bg-grey-2 relative-position" style="min-height: 150px;">
              <q-img
                v-if="scannedItem.image_url"
                :src="scannedItem.image_url"
                class="full-height"
                ratio="1"
                fit="cover"
              />
              <q-icon v-else name="image" size="3rem" color="grey-4" />
            </div>

            <!-- Basic Properties -->
            <div class="col-7 q-pa-md flex flex-col justify-between">
              <div>
                <span class="text-caption text-weight-bold text-primary text-uppercase">
                  {{ scannedItem.brand_name || 'Generic' }}
                </span>
                <div class="text-h6 text-weight-bold text-grey-9 q-mt-xs line-height-sm">
                  {{ scannedItem.name || scannedItem.brand_name || scannedItem.barcode }}
                </div>
                
                <div class="row items-center q-gutter-x-sm text-caption text-grey-6 q-mt-sm">
                  <span v-if="scannedItem.color" class="row items-center">
                    <q-badge rounded :style="{ backgroundColor: getBadgeColor(scannedItem.color) }" class="q-mr-xs border-light" />
                    {{ scannedItem.color }}
                  </span>
                  <span>•</span>
                  <span>Sz {{ scannedItem.size || 'N/A' }}</span>
                </div>
              </div>

              <!-- Status & Condition Badge Row -->
              <div class="row q-gutter-xs q-mt-sm">
                <q-chip
                  dense
                  :color="getStatusColor(scannedItem.status)"
                  text-color="white"
                  class="text-uppercase text-weight-bold q-ma-none text-xxs"
                  style="height: 18px;"
                >
                  {{ scannedItem.status }}
                </q-chip>
                <q-chip
                  dense
                  outline
                  color="grey-8"
                  class="text-uppercase text-weight-bold q-ma-none text-xxs"
                  style="height: 18px;"
                >
                  {{ formatCondition(scannedItem.condition) }}
                </q-chip>
              </div>
            </div>
          </div>

          <!-- Extended Details List -->
          <q-list class="bg-grey-1" separator>
            <q-item dense class="q-py-md">
              <q-item-section avatar>
                <q-icon name="sell" color="grey-7" size="xs" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-caption text-grey-5 text-uppercase text-weight-medium">Listed Pricing</q-item-label>
                <q-item-label class="text-subtitle1 text-weight-bold text-grey-9">
                  ${{ scannedItem.listed_price?.toFixed(2) }}
                  <span class="text-caption text-grey-6 text-weight-regular q-ml-md">
                    (Cost: ${{ scannedItem.cost_of_goods_sold?.toFixed(2) }} | Target: ${{ scannedItem.target_price?.toFixed(2) }})
                  </span>
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item dense class="q-py-md">
              <q-item-section avatar>
                <q-icon name="layers" color="grey-7" size="xs" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-caption text-grey-5 text-uppercase text-weight-medium">Location & Shelf</q-item-label>
                <q-item-label class="text-body2 text-grey-9 font-semibold">
                  {{ scannedItem.shelf_code || 'No Shelf Code Assigned' }}
                  <span v-if="scannedItem.shelf_name" class="text-grey-6 text-weight-regular q-ml-sm">
                    ({{ scannedItem.shelf_name }})
                  </span>
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item dense class="q-py-md">
              <q-item-section avatar>
                <q-icon name="local_shipping" color="grey-7" size="xs" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-caption text-grey-5 text-uppercase text-weight-medium">Shipment Context</q-item-label>
                <q-item-label class="text-body2 text-grey-9">
                  {{ scannedItem.shipment_name || 'Direct / Unknown Shipment' }}
                  <span v-if="scannedItem.box_name" class="text-amber-9 text-weight-bold q-ml-md text-caption">
                    Box: {{ scannedItem.box_name }}
                  </span>
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item dense class="q-py-md" v-if="scannedItem.product_weight || scannedItem.note">
              <q-item-section avatar>
                <q-icon name="description" color="grey-7" size="xs" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-caption text-grey-5 text-uppercase text-weight-medium">Specs & Notes</q-item-label>
                <q-item-label class="text-body2 text-grey-9">
                  <span v-if="scannedItem.product_weight">Weight: {{ scannedItem.product_weight }}g</span>
                  <span v-if="scannedItem.extra_weight"> (+{{ scannedItem.extra_weight }}g extra)</span>
                  <div v-if="scannedItem.note" class="text-italic text-grey-6 q-mt-xs">
                    "{{ scannedItem.note }}"
                  </div>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- No Item Found State -->
      <div v-else-if="searchedBarcode" class="text-center q-py-xl bg-white rounded-borders shadow-1 border-dashed-grey q-px-md">
        <q-icon name="warning" size="4rem" color="warning" class="q-mb-md" />
        <div class="text-h6 text-grey-7 text-weight-medium">Item Not Found</div>
        <p class="text-caption text-grey-6">
          No stock registered under the barcode: <strong class="text-grey-9">{{ searchedBarcode }}</strong>.
        </p>
        <div class="q-mt-md row justify-center q-gutter-sm">
          <q-btn
            color="primary"
            label="Register This Item"
            no-caps
            class="q-px-md"
            @click="goToRegisterStock"
          />
          <q-btn
            color="grey-7"
            flat
            label="Clear"
            no-caps
            @click="clearResult"
          />
        </div>
      </div>

      <!-- Initial State -->
      <div v-else class="text-center q-py-xl text-grey-5">
        <q-icon name="search" size="4rem" color="grey-3" class="q-mb-md" />
        <div class="text-subtitle1 text-weight-medium">Awaiting Barcode Scan</div>
        <p class="text-caption q-px-lg">Use the green Scan Barcode button above or type/paste in a code to lookup product information.</p>
      </div>

      <!-- Web Simulated Scanner Dialog -->
      <q-dialog v-model="showSimDialog" persistent>
        <q-card style="min-width: 300px;" class="rounded-borders">
          <q-card-section class="bg-primary text-white row items-center q-py-sm">
            <div class="text-subtitle1 text-weight-bold">Web Barcode Simulator</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section class="q-gutter-y-md q-pt-md">
            <q-input
              v-model="simulatedBarcode"
              outlined
              dense
              label="Enter Simulated Barcode"
              placeholder="e.g. BC-1-2-12345"
              autofocus
              @keyup.enter="confirmSimulatedScan"
            />
            <p class="text-caption text-grey-6 q-my-none">
              Type or copy a barcode you'd like to test. e.g. from the Stock List page.
            </p>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" color="grey-7" no-caps v-close-popup />
            <q-btn
              label="Submit"
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from '../boot/supabase'
import { useAuthStore } from '../stores/authStore'
import { useThriftStore } from '../stores/thriftStore'
import { Capacitor } from '@capacitor/core'
import { useBarcodeScan } from '../composables/useBarcodeScan'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const thriftStore = useThriftStore()
const { scanBarcode } = useBarcodeScan()

// State
const manualBarcode = ref('')
const searching = ref(false)
const scannedItem = ref<any | null>(null)
const searchedBarcode = ref('')

// Simulator state
const showSimDialog = ref(false)
const simulatedBarcode = ref('')

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
      $q.notify({ type: 'negative', message })
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
    $q.notify({ type: 'negative', message: 'User session expired or tenant not selected' })
    return
  }

  if (!barcodeVal.trim()) return

  const barcode = barcodeVal.trim()
  searching.value = true
  scannedItem.value = null
  searchedBarcode.value = barcode

  try {
    const { data, error } = await supabase
      .from('thrift_stocks')
      .select(`
        id,
        name,
        brand_name,
        color,
        size,
        condition,
        barcode,
        status,
        product_weight,
        extra_weight,
        note,
        thrift_pricings (
          cost_of_goods_sold,
          target_price,
          listed_price
        ),
        thrift_stock_images (
          image_url,
          is_primary
        ),
        thrift_shelves (
          shelf_code,
          name
        ),
        thrift_shipments (
          name
        ),
        thrift_boxes (
          name
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('barcode', barcode)
      .maybeSingle()

    if (error) throw error

    if (data) {
      const raw = data as any
      // Map properties
      const pricing = Array.isArray(raw.thrift_pricings) ? (raw.thrift_pricings[0] || {}) : (raw.thrift_pricings || {})
      const imgs = raw.thrift_stock_images || []
      const primaryImg = imgs.find((i: any) => i.is_primary) || imgs[0]
      const shelf = Array.isArray(raw.thrift_shelves) ? (raw.thrift_shelves[0] || {}) : (raw.thrift_shelves || {})
      const shipment = Array.isArray(raw.thrift_shipments)
        ? (raw.thrift_shipments[0] || {})
        : (raw.thrift_shipments || {})
      const box = Array.isArray(raw.thrift_boxes) ? (raw.thrift_boxes[0] || {}) : (raw.thrift_boxes || {})

      scannedItem.value = {
        id: raw.id,
        name: raw.name,
        brand_name: raw.brand_name,
        color: raw.color,
        size: raw.size,
        condition: raw.condition,
        barcode: raw.barcode,
        status: raw.status,
        product_weight: raw.product_weight,
        extra_weight: raw.extra_weight,
        note: raw.note,
        cost_of_goods_sold: pricing.cost_of_goods_sold ? parseFloat(pricing.cost_of_goods_sold) : 0,
        target_price: pricing.target_price ? parseFloat(pricing.target_price) : 0,
        listed_price: pricing.listed_price ? parseFloat(pricing.listed_price) : 0,
        image_url: primaryImg?.image_url || '',
        shelf_code: shelf.shelf_code || '',
        shelf_name: shelf.name || '',
        shipment_name: shipment.name || '',
        box_name: box.name || ''
      }
    } else {
      scannedItem.value = null
    }
  } catch (err: unknown) {
    console.error('Lookup barcode error:', err)
    const message = err instanceof Error ? err.message : 'Error querying stock catalog'
    $q.notify({ type: 'negative', message })
  } finally {
    searching.value = false
  }
}

const clearResult = () => {
  scannedItem.value = null
  searchedBarcode.value = ''
  manualBarcode.value = ''
}

const goToRegisterStock = () => {
  // Pre-load the scanned barcode value into the store so it is ready on the Register Stock page!
  if (searchedBarcode.value) {
    thriftStore.setTempBarcode(searchedBarcode.value)
  }
  router.push('/register-stock')
}

// Helpers
const getStatusColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE': return 'positive'
    case 'OUT_OF_STOCK': return 'grey-6'
    case 'DAMAGED': return 'warning'
    case 'STOLEN': return 'negative'
    default: return 'primary'
  }
}

const formatCondition = (cond: string) => {
  return cond?.replace(/_/g, ' ') || ''
}

const getBadgeColor = (colorName: string) => {
  const name = colorName?.toLowerCase().trim()
  if (!name) return 'transparent'
  
  const map: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#f59e0b',
    orange: '#f97316',
    purple: '#8b5cf6',
    pink: '#ec4899',
    grey: '#6b7280',
    gray: '#6b7280',
    brown: '#78350f',
    navy: '#1e3a8a'
  }
  
  return map[name] || '#9ca3af'
}
</script>

<style scoped>
.border-dashed-grey {
  border: 2px dashed #e2e8f0;
}

.border-bottom-light {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.font-semibold {
  font-weight: 600;
}

.text-xxs {
  font-size: 10px;
  line-height: 12px;
}

.text-weight-mono {
  font-family: monospace;
}

.letter-spacing-xs {
  letter-spacing: 0.05em;
}
</style>
