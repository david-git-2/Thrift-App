<template>
  <q-page class="bw-page theme-app">
    <div class="bw-page__stack">
      <!-- Active Shipment & Box context banner -->
      <q-banner dense class="app-context-banner text-white q-py-sm">
        <template v-slot:avatar>
          <q-icon name="workspaces" color="white" />
        </template>
        <div class="row items-center justify-between no-wrap full-width">
          <div class="text-body2 text-weight-medium ellipsis">
            {{ selectedShipment?.name || 'No shipment' }}
            <span class="text-caption text-amber-3">
              · {{ selectedBox?.name || 'No box' }}
            </span>
          </div>
          <q-btn
            flat
            dense
            no-caps
            color="white"
            icon="edit"
            label="Change"
            @click="changeContext"
            class="q-ml-sm"
          />
        </div>
      </q-banner>

      <!-- Main container grid -->
      <div class="row q-col-gutter-md">
        <!-- LEFT COLUMN: Capture Barcode & Image -->
        <div class="col-12 col-md-5 q-gutter-y-md">
          <!-- Capture Barcode Card -->
          <q-card class="app-card">
            <q-card-section>
              <div class="app-section-title">
                <q-icon name="qr_code" />
                Barcode Identification
              </div>

              <!-- Barcode Display / Scan Button -->
              <div v-if="tempBarcode" class="app-capture-zone q-pa-md text-center relative-position">
                <div class="text-h6 text-weight-medium text-grey-9 letter-space-wide q-py-xs">
                  {{ tempBarcode }}
                </div>
                <div
                  class="text-caption font-semibold row items-center justify-center q-mt-xs"
                  :class="barcodeAvailability === 'available' ? 'text-positive' : 'text-negative'"
                >
                  <q-icon
                    :name="barcodeAvailability === 'available' ? 'check_circle' : 'cancel'"
                    size="xs"
                    class="q-mr-xs"
                  />
                  {{ barcodeStatusLabel }}
                </div>
                <q-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  size="sm"
                  class="absolute-top-right q-ma-sm"
                  @click="clearBarcode"
                />
              </div>

              <div v-else-if="barcodeChecking" class="text-center q-py-md">
                <PageInitialLoader compact message="Checking barcode..." />
              </div>

              <div v-else class="q-py-sm q-gutter-y-sm">
                <q-btn
                  color="primary"
                  unelevated
                  icon="qr_code_scanner"
                  label="Scan Barcode"
                  class="full-width app-cta-btn"
                  no-caps
                  @click="startBarcodeScan"
                />

                <div class="row items-center q-my-xs">
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
                      @keyup.enter="submitManualBarcode"
                    />
                  </div>
                  <div class="col-auto">
                    <q-btn
                      color="primary"
                      icon="check"
                      class="full-height"
                      :disabled="!manualBarcode.trim()"
                      @click="submitManualBarcode"
                    />
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Capture Image Card -->
          <q-card class="app-card">
            <q-card-section>
              <div class="app-section-title">
                <q-icon name="photo_camera" />
                Product Image
              </div>

              <!-- Image Display / Capture Button -->
              <div v-if="previewImageUrl" class="app-capture-zone q-pa-sm text-center relative-position">
                <q-img
                  :src="previewImageUrl"
                  class="rounded-borders uploaded-preview"
                  style="max-height: 240px;"
                  fit="contain"
                />
                <q-btn
                  round
                  color="primary"
                  icon="crop"
                  size="sm"
                  class="absolute-top-left q-ma-md"
                  @click="startImageCrop"
                />
                <q-btn
                  round
                  color="negative"
                  icon="delete"
                  size="sm"
                  class="absolute-top-right q-ma-md"
                  @click="clearImage"
                />
              </div>

              <div v-else class="text-center q-py-lg">
                <q-btn
                  color="primary"
                  unelevated
                  icon="camera_alt"
                  label="Take Photo"
                  class="q-px-lg app-cta-btn"
                  style="min-height: 44px !important; box-shadow: none;"
                  no-caps
                  @click="startCameraCapture"
                />
                <div class="text-caption text-grey-6 q-mt-xs">Capture physical item appearance</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- RIGHT COLUMN: Stock Attributes Form -->
        <div class="col-12 col-md-7">
          <q-card class="app-card">
            <q-card-section class="q-pb-none">
              <div class="app-section-title">
                <q-icon name="style" />
                Product Attributes
              </div>
            </q-card-section>

            <q-card-section class="q-gutter-y-md">
            <q-form ref="stockFormRef" class="q-gutter-y-md">
              <div class="row q-col-gutter-sm">
                <!-- Brand -->
                <div class="col-12">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Brand Name *</label>
                  <q-input
                    v-model="form.brand_name"
                    outlined
                    dense
                    placeholder="e.g. Nike"
                    :rules="[val => !!val?.trim() || 'Required']"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-sm">
                <!-- Category -->
                <div class="col-12 col-sm-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Category</label>
                  <q-select
                    v-model="form.category_id"
                    :options="categoryOptions"
                    option-label="name"
                    option-value="id"
                    emit-value
                    map-options
                    outlined
                    dense
                    clearable
                    label="Select Category"
                    :loading="loadingMeta"
                  >
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section avatar>
                          <q-icon name="category" />
                        </q-item-section>
                        <q-item-section>{{ scope.opt.name }}</q-item-section>
                      </q-item>
                    </template>
                    <template #selected-item="scope">
                      <span v-if="scope.opt" class="row items-center no-wrap">
                        <q-icon name="category" class="q-mr-sm" />
                        {{ scope.opt.name }}
                      </span>
                    </template>
                  </q-select>
                </div>

                <!-- Type/Style -->
                <div class="col-12 col-sm-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Style / Type</label>
                  <q-select
                    v-model="form.type_id"
                    :options="typeOptions"
                    option-label="name"
                    option-value="id"
                    emit-value
                    map-options
                    outlined
                    dense
                    clearable
                    label="Select Style"
                    :loading="loadingMeta"
                  >
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section avatar>
                          <q-icon :name="resolveTypeIcon(scope.opt.icon)" />
                        </q-item-section>
                        <q-item-section>{{ scope.opt.name }}</q-item-section>
                      </q-item>
                    </template>
                    <template #selected-item="scope">
                      <span v-if="scope.opt" class="row items-center no-wrap">
                        <q-icon :name="resolveTypeIcon(scope.opt.icon)" class="q-mr-sm" />
                        {{ scope.opt.name }}
                      </span>
                    </template>
                  </q-select>
                </div>
              </div>

              <div class="row q-col-gutter-sm">
                <!-- Section -->
                <div class="col-12 col-sm-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Section</label>
                  <q-select
                    v-model="form.section"
                    :options="THRIFT_SECTION_OPTIONS"
                    outlined
                    dense
                    clearable
                  />
                </div>

                <!-- Shelf -->
                <div class="col-12 col-sm-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Shelf / Location</label>
                  <q-select
                    v-model="form.shelf_id"
                    :options="shelfOptions"
                    option-label="shelf_code"
                    option-value="id"
                    emit-value
                    map-options
                    outlined
                    dense
                    clearable
                    label="Select Shelf"
                    :loading="loadingMeta"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-sm">
                <!-- Color -->
                <div class="col-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Color</label>
                  <q-input
                    v-model="form.color"
                    outlined
                    dense
                    placeholder="e.g. Navy Blue"
                  />
                </div>

                <!-- Size -->
                <div class="col-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Size</label>
                  <q-input
                    v-model="form.size"
                    outlined
                    dense
                    placeholder="e.g. XL"
                  />
                </div>
              </div>

              <!-- Condition -->
              <div>
                <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Condition *</label>
                <q-select
                  v-model="form.condition"
                  :options="THRIFT_CONDITION_OPTIONS"
                  outlined
                  dense
                  :rules="[val => !!val || 'Required']"
                />
              </div>

              <!-- Weights -->
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Product Weight (g) *</label>
                  <q-input
                    v-model.number="form.product_weight"
                    type="number"
                    step="1"
                    min="1"
                    outlined
                    dense
                    placeholder="e.g. 250"
                    :rules="[val => val != null && val > 0 || 'Required']"
                  />
                </div>
                <div class="col-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Extra Weight (g)</label>
                  <q-input
                    v-model.number="form.extra_weight"
                    type="number"
                    step="1"
                    min="0"
                    outlined
                    dense
                    placeholder="0"
                  />
                </div>
              </div>

              <q-separator class="q-my-md" />

              <!-- Purchase pricing -->
              <div class="text-caption text-grey-8 q-mb-xs">
                Purchase ({{ purchaseCurrency?.code ?? '—' }})
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Origin Purchase Price</label>
                  <q-input
                    v-model.number="form.origin_purchase_price"
                    type="number"
                    step="0.01"
                    min="0"
                    outlined
                    dense
                    placeholder="0.00"
                    :prefix="purchaseCurrencySymbol"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Extra Origin Purchase Expense</label>
                  <q-input
                    v-model.number="extraOriginPurchaseExpense"
                    type="number"
                    step="0.01"
                    min="0"
                    outlined
                    dense
                    placeholder="0.00"
                    :prefix="purchaseCurrencySymbol"
                  />
                </div>
              </div>

              <q-separator class="q-my-sm" />

              <!-- Cost / pricing -->
              <div class="text-caption text-grey-8 q-mb-xs">
                Cost / pricing ({{ costCurrency?.code ?? '—' }})
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">COGS Cost</label>
                  <q-input
                    v-model.number="pricing.cost_of_goods_sold"
                    type="number"
                    step="0.01"
                    min="0"
                    outlined
                    dense
                    placeholder="0.00"
                    :prefix="costCurrencySymbol"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Extra Expense Cost</label>
                  <q-input
                    v-model.number="pricing.extra_expense_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    outlined
                    dense
                    placeholder="0.00"
                    :prefix="costCurrencySymbol"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Target Price</label>
                  <q-input
                    v-model.number="pricing.target_price"
                    type="number"
                    step="0.01"
                    min="0"
                    outlined
                    dense
                    placeholder="0.00"
                    :prefix="costCurrencySymbol"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Listed Price</label>
                  <q-input
                    v-model.number="pricing.listed_price"
                    type="number"
                    step="0.01"
                    min="0"
                    outlined
                    dense
                    placeholder="0.00"
                    :prefix="costCurrencySymbol"
                  />
                </div>
              </div>

              <q-separator class="q-my-md" />

              <!-- Note -->
              <div>
                <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Note / Remarks</label>
                <q-input
                  v-model="form.note"
                  type="textarea"
                  outlined
                  dense
                  rows="3"
                  placeholder="Any additional details or defect mentions..."
                />
              </div>
            </q-form>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="row justify-end q-mt-md q-mb-lg">
        <q-btn
          color="primary"
          icon="save"
          label="Save item"
          class="q-px-lg app-cta-btn"
          no-caps
          size="md"
          style="min-height: 40px !important;"
          :loading="submitting"
          @click="submitStock"
        />
      </div>

      <input
        type="file"
        ref="fileInput"
        accept="image/*"
        class="hidden"
        @change="handleWebFileChange"
      />

    </div>

    <PageInitialLoader
      v-if="submitting"
      overlay
      message="Uploading image and saving stock..."
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar, type QForm } from 'quasar'
import { useThriftStore } from '../stores/thriftStore'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../boot/supabase'
import { Capacitor } from '@capacitor/core'
import { useBarcodeScan } from '../composables/useBarcodeScan'
import { useProductPhoto } from '../composables/useProductPhoto'
import {
  registerThriftStockFromApp,
  uploadToCloudinary,
} from '../composables/useThriftStockRegister'
import { deleteCloudinaryByToken } from '../utils/cloudinaryClient'
import {
  validateBarcodeForRegistration,
  type BarcodeAvailability,
} from '../composables/useThriftBarcode'
import {
  fetchThriftCategories,
  fetchThriftDefaultPurchasePriceGbp,
  fetchThriftShelves,
  fetchThriftTypes,
  type ThriftCatalogOption,
} from '../composables/useThriftCatalog'
import { useThriftCurrencyStore } from '../stores/thriftCurrencyStore'
import {
  THRIFT_CONDITION_OPTIONS,
  THRIFT_SECTION_OPTIONS,
} from '../constants/thriftEnums'
import { resolveTypeIcon } from '../utils/typeIcon'
import { refreshShipmentCurrencyIds } from '../composables/useThriftShipment'
import PageInitialLoader from '../components/PageInitialLoader.vue'

const router = useRouter()
const $q = useQuasar()
const thriftStore = useThriftStore()
const authStore = useAuthStore()
const currencyStore = useThriftCurrencyStore()
const { scanBarcode } = useBarcodeScan()
const { capturePhoto, cropPhoto } = useProductPhoto()

// State
const stockFormRef = ref<QForm | null>(null)
const categoryOptions = ref<ThriftCatalogOption[]>([])
const typeOptions = ref<ThriftCatalogOption[]>([])
const shelfOptions = ref<any[]>([])
const loadingMeta = ref(false)
const submitting = ref(false)
const extraOriginPurchaseExpense = ref(0)

// Web Capture variables
const fileInput = ref<HTMLInputElement | null>(null)
const webBlob = ref<Blob | null>(null)
const manualBarcode = ref('')
const barcodeChecking = ref(false)
const barcodeAvailability = ref<BarcodeAvailability | null>(null)

// Core Inputs Form
const form = ref({
  brand_name: '',
  category_id: null as number | null,
  type_id: null as number | null,
  section: null as string | null,
  shelf_id: null as number | null,
  color: '',
  size: '',
  condition: null as string | null,
  product_weight: null as number | null,
  extra_weight: null as number | null,
  origin_purchase_price: null as number | null,
  note: ''
})

const pricing = ref({
  cost_of_goods_sold: 0,
  target_price: 0,
  listed_price: 0,
  extra_expense_cost: 0,
})

// Get values from Store
const selectedShipment = computed(() => thriftStore.selectedShipment)
const selectedBox = computed(() => thriftStore.selectedBox)
const tempBarcode = computed(() => thriftStore.tempBarcode)
const tempImage = computed(() => thriftStore.tempImage) // base64 or webPath
const tenantId = computed(() => authStore.tenantId)
const userEmail = computed(() => authStore.user?.email || 'app-user@brandwala.com')

const purchaseCurrency = computed(() =>
  currencyStore.currencyById(selectedShipment.value?.purchase_currency_id),
)
const costCurrency = computed(() =>
  currencyStore.currencyById(selectedShipment.value?.cost_currency_id),
)
const purchaseCurrencySymbol = computed(() => purchaseCurrency.value?.symbol ?? '')
const costCurrencySymbol = computed(() => costCurrency.value?.symbol ?? '')

// Resolve preview image URL
const previewImageUrl = computed(() => {
  if (tempImage.value) {
    return tempImage.value
  }
  return ''
})

const barcodeStatusLabel = computed(() => {
  if (barcodeAvailability.value === 'available') return 'Available — ready to register'
  if (barcodeAvailability.value === 'used') return 'Already used — scan another barcode'
  if (barcodeAvailability.value === 'not_found') return 'Not in catalog — scan another barcode'
  return 'Barcode scanned'
})

// Lifecycle Hooks
onMounted(async () => {
  if (!selectedShipment.value) {
    $q.notify({
      type: 'warning',
      message: 'Please select active Shipment & Box first',
    })
    router.replace('/insert-stock')
    return
  }

  let shipment = selectedShipment.value
  if (
    shipment.purchase_currency_id == null ||
    shipment.cost_currency_id == null
  ) {
    if (!tenantId.value) {
      router.replace('/insert-stock')
      return
    }
    try {
      const refreshed = await refreshShipmentCurrencyIds(shipment.id, tenantId.value)
      if (!refreshed) {
        $q.notify({ type: 'warning', message: 'Shipment no longer exists. Please select again.' })
        router.replace('/insert-stock')
        return
      }
      thriftStore.setSelection(refreshed, selectedBox.value)
      shipment = refreshed
    } catch {
      $q.notify({ type: 'negative', message: 'Could not load shipment currency settings.' })
      router.replace('/insert-stock')
      return
    }
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !sessionData.session) {
    $q.notify({ type: 'negative', message: 'Session expired. Please log in again.' })
    router.replace('/login')
    return
  }

  await Promise.all([loadDropdowns(), currencyStore.loadCurrencies()])
  await loadTenantSettings()

  if (tempBarcode.value) {
    await applyScannedBarcode(tempBarcode.value)
  }
})

// Methods
const changeContext = () => {
  thriftStore.clearShipmentBox()
  router.push('/insert-stock')
}

const submitManualBarcode = async () => {
  const value = manualBarcode.value.trim()
  if (!value) return
  await applyScannedBarcode(value)
  manualBarcode.value = ''
}

const loadDropdowns = async () => {
  if (!tenantId.value) return
  loadingMeta.value = true
  try {
    const [categories, types, shelves] = await Promise.all([
      fetchThriftCategories(tenantId.value),
      fetchThriftTypes(tenantId.value),
      fetchThriftShelves(tenantId.value),
    ])

    categoryOptions.value = categories
    typeOptions.value = types
    shelfOptions.value = shelves
  } catch (err) {
    console.error('Error fetching dropdown choices:', err)
    const detail = err instanceof Error ? err.message : 'Unknown error'
    $q.notify({ type: 'negative', message: `Failed to load options: ${detail}` })
  } finally {
    loadingMeta.value = false
  }
}

const loadTenantSettings = async () => {
  if (!tenantId.value) return
  try {
    const defaultPrice = await fetchThriftDefaultPurchasePriceGbp(tenantId.value)
    if (defaultPrice !== null) {
      form.value.origin_purchase_price = defaultPrice
    }
  } catch (err) {
    console.warn('Could not load tenant default settings:', err)
  }
}

// Scanning Features
const applyScannedBarcode = async (barcodeVal: string) => {
  if (!tenantId.value) {
    $q.notify({ type: 'negative', message: 'Workspace is missing. Go back and select one.' })
    return
  }

  barcodeChecking.value = true
  barcodeAvailability.value = null

  try {
    const result = await validateBarcodeForRegistration(tenantId.value, barcodeVal)
    barcodeAvailability.value = result.availability

    if (!result.ok) {
      thriftStore.setTempBarcode(null)
      $q.notify({ type: 'negative', message: result.message })
      return
    }

    thriftStore.setTempBarcode(result.canonicalBarcodeId || barcodeVal.trim())
    $q.notify({ type: 'positive', message: result.message })
  } catch (err) {
    console.error('Barcode validation error:', err)
    thriftStore.setTempBarcode(null)
    barcodeAvailability.value = null
    const message = err instanceof Error ? err.message : 'Could not validate barcode'
    $q.notify({ type: 'negative', message })
  } finally {
    barcodeChecking.value = false
  }
}

const startBarcodeScan = async () => {
  try {
    const barcodeVal = await scanBarcode()
    if (barcodeVal) {
      await applyScannedBarcode(barcodeVal)
    }
  } catch (err) {
    console.error('Barcode scanning error:', err)
    const message = err instanceof Error ? err.message : 'Error scanning barcode'
    $q.notify({ type: 'warning', message: `${message}. Enter barcode manually.` })
  }
}

const clearBarcode = () => {
  thriftStore.setTempBarcode(null)
  barcodeAvailability.value = null
}

// Camera Features
const startCameraCapture = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await capturePhoto()
      if (result) {
        thriftStore.setTempImage(result.webPath)
        webBlob.value = result.blob
        $q.notify({ type: 'positive', message: 'Photo captured!' })
      }
    } catch (err) {
      console.error('Camera capture error:', err)
      const message = err instanceof Error ? err.message : 'Camera error'
      $q.notify({ type: 'negative', message: `${message}. Falling back to file upload.` })
      fileInput.value?.click()
    }
  } else {
    fileInput.value?.click()
  }
}

const startImageCrop = async () => {
  if (!previewImageUrl.value) return

  if (Capacitor.isNativePlatform()) {
    try {
      const result = await cropPhoto(previewImageUrl.value)
      if (result) {
        thriftStore.setTempImage(result.webPath)
        webBlob.value = result.blob
        $q.notify({ type: 'positive', message: 'Photo cropped!' })
      }
    } catch (err) {
      console.error('Crop error:', err)
      const message = err instanceof Error ? err.message : 'Crop failed'
      $q.notify({ type: 'negative', message })
    }
  } else {
    $q.notify({ type: 'info', message: 'Crop is only available in the native app' })
  }
}

const handleWebFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    webBlob.value = file
    const url = URL.createObjectURL(file)
    thriftStore.setTempImage(url)
    $q.notify({ type: 'positive', message: 'File selected!' })
  }
}

const clearImage = () => {
  thriftStore.setTempImage(null)
  webBlob.value = null
}

// Save & Submit Actions
const submitStock = async () => {
  // Validations
  if (!tenantId.value || !selectedShipment.value) {
    $q.notify({ type: 'negative', message: 'Workspace is missing. Go back and select one.' })
    return
  }

  if (!tempBarcode.value) {
    $q.notify({ type: 'negative', message: 'Please scan or input a barcode first' })
    return
  }

  if (barcodeAvailability.value !== 'available') {
    $q.notify({ type: 'negative', message: 'Please scan an available barcode before registering' })
    return
  }

  if (!webBlob.value) {
    $q.notify({ type: 'negative', message: 'Please take or choose a product photo first' })
    return
  }

  const formValid = await stockFormRef.value?.validate()
  if (!formValid) {
    $q.notify({ type: 'negative', message: 'Please fill in all required fields' })
    return
  }

  submitting.value = true

  let pendingDeleteToken = ''
  try {
    const imgName = `stock_${tempBarcode.value}.jpg`
    const uploadResult = await uploadToCloudinary(webBlob.value, imgName)
    pendingDeleteToken = uploadResult.deleteToken || ''

    await registerThriftStockFromApp({
      tenantId: tenantId.value,
      barcode: tempBarcode.value,
      shipmentId: selectedShipment.value.id,
      imageUrl: uploadResult.secureUrl,
      brandName: form.value.brand_name || null,
      categoryId: form.value.category_id,
      typeId: form.value.type_id,
      section: form.value.section,
      shelfId: form.value.shelf_id,
      color: form.value.color || null,
      size: form.value.size || null,
      condition: form.value.condition,
      ...(selectedBox.value ? { boxId: selectedBox.value.id } : {}),
      productWeight: form.value.product_weight,
      extraWeight: form.value.extra_weight,
      note: form.value.note,
      originPurchasePrice: form.value.origin_purchase_price,
      extraOriginPurchaseExpense: extraOriginPurchaseExpense.value || null,
      costOfGoodsSold: pricing.value.cost_of_goods_sold,
      targetPrice: pricing.value.target_price,
      listedPrice: pricing.value.listed_price,
      extraExpenseCost: pricing.value.extra_expense_cost || null,
      insertedBy: userEmail.value,
    })

    $q.notify({
      type: 'positive',
      message: 'Product registered successfully!'
    })

    // Reset scan capture
    thriftStore.clearTemp()
    webBlob.value = null
    barcodeAvailability.value = null
    
    // Clear brand, notes, sizes, colors so they don't insert duplicate values
    // but KEEP category, type, section, condition, shelf and pricing as defaults for faster sequential inputs!
    form.value.brand_name = ''
    form.value.color = ''
    form.value.size = ''
    form.value.note = ''
    form.value.product_weight = null
    form.value.extra_weight = null
    form.value.origin_purchase_price = null
    extraOriginPurchaseExpense.value = 0

  } catch (err: any) {
    if (pendingDeleteToken) {
      await deleteCloudinaryByToken(pendingDeleteToken)
    }
    console.error('Error saving thrift stock:', err)
    $q.notify({
      type: 'negative',
      message: err.message || 'Registration failed'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.uploaded-preview {
  border-radius: 12px;
  border: 1px solid rgb(var(--bw-theme-primary-rgb) / 0.1);
}
.letter-space-wide {
  letter-spacing: 0.1em;
}
.font-semibold {
  font-weight: 600;
}
</style>
