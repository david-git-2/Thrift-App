<template>
  <q-page class="bw-page theme-app">
    <div class="bw-page__stack">
      <!-- Active Shipment & Box context banner -->
      <q-banner dense class="app-context-banner text-white q-py-sm">
        <template v-slot:avatar>
          <q-icon name="workspaces" color="white" />
        </template>
        <div class="row items-center justify-between no-wrap">
          <div>
            <div class="text-weight-bold">
              Active: {{ selectedShipment ? selectedShipment.name : 'No Shipment' }}
            </div>
            <div class="text-caption text-amber-3 text-weight-medium">
              Box: {{ selectedBox ? selectedBox.name : 'No Box Selected' }}
            </div>
          </div>
          <q-btn
            flat
            dense
            no-caps
            color="white"
            icon="edit"
            label="Change"
            @click="changeContext"
            class="q-ml-md"
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

              <div v-else class="text-center q-py-md">
                <q-btn
                  color="primary"
                  unelevated
                  icon="qr_code_scanner"
                  label="Scan Barcode"
                  class="q-px-lg app-cta-btn"
                  style="min-height: 44px !important; box-shadow: none;"
                  no-caps
                  @click="startBarcodeScan"
                />
                <div class="text-caption text-grey-6 q-mt-xs">Use camera to scan item barcode</div>
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
              <div class="row q-col-gutter-sm">
                <!-- Brand -->
                <div class="col-12">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Brand Name</label>
                  <q-input
                    v-model="form.brand_name"
                    outlined
                    dense
                    placeholder="e.g. Nike"
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
                  />
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
                  />
                </div>
              </div>

              <div class="row q-col-gutter-sm">
                <!-- Section -->
                <div class="col-12 col-sm-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Section</label>
                  <q-select
                    v-model="form.section"
                    :options="['UNISEX', 'MENS', 'WOMENS', 'KIDS']"
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
                <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Condition</label>
                <q-select
                  v-model="form.condition"
                  :options="['NEW', 'LIKE_NEW', 'EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR']"
                  outlined
                  dense
                  clearable
                />
              </div>

              <!-- Weights -->
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Product Wt (kg)</label>
                  <q-input
                    v-model.number="form.product_weight"
                    type="number"
                    step="0.001"
                    outlined
                    dense
                    placeholder="0.000"
                  />
                </div>
                <div class="col-6">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Extra Wt (kg)</label>
                  <q-input
                    v-model.number="form.extra_weight"
                    type="number"
                    step="0.001"
                    outlined
                    dense
                    placeholder="0.000"
                  />
                </div>
              </div>

              <q-separator class="q-my-md" />

              <!-- Pricing Section -->
              <div class="text-subtitle2 text-weight-bold text-grey-9 q-mb-xs">Pricing & Costing</div>
              <div class="row q-col-gutter-sm">
                <div class="col-4">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Purchase Cost</label>
                  <q-input
                    v-model.number="pricing.cost_of_goods_sold"
                    type="number"
                    step="0.01"
                    outlined
                    dense
                    placeholder="0.00"
                  />
                </div>
                <div class="col-4">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Target Price</label>
                  <q-input
                    v-model.number="pricing.target_price"
                    type="number"
                    step="0.01"
                    outlined
                    dense
                    placeholder="0.00"
                  />
                </div>
                <div class="col-4">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Listed Price</label>
                  <q-input
                    v-model.number="pricing.listed_price"
                    type="number"
                    step="0.01"
                    outlined
                    dense
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-sm q-mt-xs">
                <div class="col-12">
                  <label class="text-caption text-weight-bold text-grey-7 block q-mb-xs">Origin Purchase Price</label>
                  <q-input
                    v-model.number="form.origin_purchase_price"
                    type="number"
                    step="0.01"
                    outlined
                    dense
                    placeholder="0.00"
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
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Action Button footer -->
      <div class="row justify-end q-mt-md q-mb-xl">
        <q-btn
          color="primary"
          icon="save"
          label="Register & Save Item"
          class="q-px-xl q-py-md text-weight-bold"
          no-caps
          size="lg"
          :loading="submitting"
          @click="submitStock"
        />
      </div>

      <!-- Web hidden file input picker -->
      <input
        type="file"
        ref="fileInput"
        accept="image/*"
        class="hidden"
        @change="handleWebFileChange"
      />

      <!-- MOCK BARCODE SCANNING DIALOG FOR WEB -->
      <q-dialog v-model="showBarcodeSimDialog" persistent>
        <q-card style="width: 380px; max-width: 90vw;">
          <q-card-section class="row items-center justify-between">
            <div class="text-h6 text-weight-bold">Simulate Barcode Scan</div>
            <q-btn flat round dense icon="close" v-close-popup />
          </q-card-section>

          <q-card-section class="q-gutter-y-md">
            <q-input
              v-model="simulatedBarcodeVal"
              outlined
              dense
              label="Enter Barcode"
              placeholder="e.g. BC-12345678"
              autofocus
            />
            
            <q-btn
              flat
              no-caps
              color="primary"
              label="Auto-Generate Barcode"
              icon="gesture"
              class="full-width"
              @click="generateSimulatedBarcode"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" color="grey-7" no-caps v-close-popup />
            <q-btn
              label="Confirm Scan"
              color="primary"
              no-caps
              :disabled="!simulatedBarcodeVal"
              @click="confirmSimulatedScan"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
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
import { useQuasar } from 'quasar'
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
import {
  validateBarcodeForRegistration,
  type BarcodeAvailability,
} from '../composables/useThriftBarcode'
import {
  fetchThriftCategories,
  fetchThriftDefaultPurchasePriceGbp,
  fetchThriftShelves,
  fetchThriftTypes,
} from '../composables/useThriftCatalog'
import PageInitialLoader from '../components/PageInitialLoader.vue'

const router = useRouter()
const $q = useQuasar()
const thriftStore = useThriftStore()
const authStore = useAuthStore()
const { scanBarcode } = useBarcodeScan()
const { capturePhoto, cropPhoto } = useProductPhoto()

// State
const categoryOptions = ref<any[]>([])
const typeOptions = ref<any[]>([])
const shelfOptions = ref<any[]>([])
const loadingMeta = ref(false)
const submitting = ref(false)

// Web Capture variables
const fileInput = ref<HTMLInputElement | null>(null)
const webBlob = ref<Blob | null>(null)

// Mock Scan states
const showBarcodeSimDialog = ref(false)
const simulatedBarcodeVal = ref('')
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
  listed_price: 0
})

// Get values from Store
const selectedShipment = computed(() => thriftStore.selectedShipment)
const selectedBox = computed(() => thriftStore.selectedBox)
const tempBarcode = computed(() => thriftStore.tempBarcode)
const tempImage = computed(() => thriftStore.tempImage) // base64 or webPath
const tenantId = computed(() => authStore.tenantId)
const userEmail = computed(() => authStore.user?.email || 'app-user@brandwala.com')

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
      message: 'Please select active Shipment & Box first'
    })
    router.replace('/insert-stock')
    return
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !sessionData.session) {
    $q.notify({ type: 'negative', message: 'Session expired. Please log in again.' })
    router.replace('/login')
    return
  }

  await loadDropdowns()
  await loadTenantSettings()

  if (tempBarcode.value) {
    await applyScannedBarcode(tempBarcode.value)
  }
})

// Methods
const changeContext = () => {
  router.push('/insert-stock')
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
      pricing.value.cost_of_goods_sold = defaultPrice
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
  if (Capacitor.isNativePlatform()) {
    try {
      const barcodeVal = await scanBarcode()
      if (barcodeVal) {
        await applyScannedBarcode(barcodeVal)
      }
    } catch (err) {
      console.error('Barcode scanning error:', err)
      const message = err instanceof Error ? err.message : 'Error scanning barcode'
      $q.notify({ type: 'negative', message })
      if (!Capacitor.isNativePlatform()) {
        simulatedBarcodeVal.value = ''
        showBarcodeSimDialog.value = true
      }
    }
  } else {
    simulatedBarcodeVal.value = ''
    showBarcodeSimDialog.value = true
  }
}

const clearBarcode = () => {
  thriftStore.setTempBarcode(null)
  barcodeAvailability.value = null
}

// Simulator Dialog actions
const generateSimulatedBarcode = () => {
  const codeSeq = Math.floor(Math.random() * 900000) + 100000
  simulatedBarcodeVal.value = `BC-${tenantId.value}-${selectedShipment.value?.id || 0}-${codeSeq}`
}

const confirmSimulatedScan = async () => {
  showBarcodeSimDialog.value = false
  if (simulatedBarcodeVal.value.trim()) {
    await applyScannedBarcode(simulatedBarcodeVal.value.trim())
  }
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

  submitting.value = true

  try {
    const imgName = `stock_${tempBarcode.value}.jpg`
    const uploadedUrl = await uploadToCloudinary(webBlob.value, imgName)

    await registerThriftStockFromApp({
      tenantId: tenantId.value,
      barcode: tempBarcode.value,
      shipmentId: selectedShipment.value.id,
      imageUrl: uploadedUrl,
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
      costOfGoodsSold: pricing.value.cost_of_goods_sold,
      targetPrice: pricing.value.target_price,
      listedPrice: pricing.value.listed_price,
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

  } catch (err: any) {
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
