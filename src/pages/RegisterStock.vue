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
                <span v-if="!tempBarcode" class="app-section-title__required-badge">Required</span>
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

              <div v-else class="q-py-sm q-gutter-y-sm app-capture-zone app-capture-zone--required">
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
                <span v-if="!previewImageUrl" class="app-section-title__required-badge">Required</span>
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

              <div v-else class="text-center q-py-lg app-capture-zone app-capture-zone--required">
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
            <div class="app-required-hint">
              <q-icon name="info" />
              Fields marked with <span class="app-field-label__mark">*</span> are required
            </div>
            <q-form ref="stockFormRef" class="q-gutter-y-md">
              <div>
                <label class="app-field-label app-field-label--required block q-mb-xs">
                  Brand Name <span class="app-field-label__mark">*</span>
                </label>
                <q-input
                  v-model="form.brand_name"
                  outlined
                  dense
                  placeholder="e.g. Nike"
                  class="app-required-input"
                  :class="{ 'app-required-input--pending': !form.brand_name?.trim() }"
                  :rules="[val => !!val?.trim() || 'Required']"
                />
              </div>

              <div>
                <label class="app-field-label app-field-label--required block q-mb-xs">
                  Size <span class="app-field-label__mark">*</span>
                </label>
                <q-input
                  v-model="form.size"
                  outlined
                  dense
                  placeholder="e.g. XL"
                  class="app-required-input"
                  :class="{ 'app-required-input--pending': !form.size?.trim() }"
                  :rules="[val => !!val?.trim() || 'Required']"
                />
              </div>

              <div>
                <label class="app-field-label app-field-label--required block q-mb-xs">
                  Condition <span class="app-field-label__mark">*</span>
                </label>
                <q-select
                  v-model="form.condition"
                  :options="THRIFT_CONDITION_OPTIONS"
                  outlined
                  dense
                  class="app-required-input"
                  :class="{ 'app-required-input--pending': !form.condition }"
                  :rules="[val => !!val || 'Required']"
                />
              </div>

              <div>
                <label class="app-field-label app-field-label--required block q-mb-xs">
                  Product Weight (g) <span class="app-field-label__mark">*</span>
                </label>
                <q-input
                  v-model.number="form.product_weight"
                  type="number"
                  step="1"
                  min="1"
                  outlined
                  dense
                  placeholder="e.g. 250"
                  class="app-required-input"
                  :class="{ 'app-required-input--pending': form.product_weight == null || form.product_weight <= 0 }"
                  :rules="[val => val != null && val > 0 || 'Required']"
                />
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
  uploadStockImage,
  cleanupStockImageAssets,
  type StockImageUploadResult,
} from '../composables/useThriftStockRegister'
import { deleteCloudinaryByToken } from '../utils/cloudinaryClient'
import {
  validateBarcodeForRegistration,
  type BarcodeAvailability,
} from '../composables/useThriftBarcode'
import { THRIFT_CONDITION_OPTIONS } from '../constants/thriftEnums'
import PageInitialLoader from '../components/PageInitialLoader.vue'

const router = useRouter()
const $q = useQuasar()
const thriftStore = useThriftStore()
const authStore = useAuthStore()
const { scanBarcode } = useBarcodeScan()
const { capturePhoto, cropPhoto } = useProductPhoto()

// State
const stockFormRef = ref<QForm | null>(null)
const submitting = ref(false)

// Web Capture variables
const fileInput = ref<HTMLInputElement | null>(null)
const webBlob = ref<Blob | null>(null)
const manualBarcode = ref('')
const barcodeChecking = ref(false)
const barcodeAvailability = ref<BarcodeAvailability | null>(null)

// Core Inputs Form
const form = ref({
  brand_name: '',
  size: '',
  condition: null as string | null,
  product_weight: null as number | null,
  note: '',
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
      message: 'Please select active Shipment & Box first',
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

  const barcode = tempBarcode.value
  const imageBlob = webBlob.value
  const shipmentId = selectedShipment.value.id
  const workspaceTenantId = tenantId.value
  const boxId = selectedBox.value?.id
  const brandName = form.value.brand_name || null
  const size = form.value.size || null
  const condition = form.value.condition
  const productWeight = form.value.product_weight
  const note = form.value.note

  thriftStore.clearTemp()
  webBlob.value = null
  barcodeAvailability.value = null
  form.value.brand_name = ''
  form.value.size = ''
  form.value.condition = null
  form.value.note = ''
  form.value.product_weight = null

  submitting.value = true

  let pendingDeleteToken = ''
  let uploadResult: StockImageUploadResult | null = null
  try {
    uploadResult = await uploadStockImage(imageBlob, {
      barcode,
      shipmentId,
      tenantId: workspaceTenantId,
    })
    pendingDeleteToken = uploadResult.deleteToken || ''

    await registerThriftStockFromApp({
      tenantId: workspaceTenantId,
      barcode,
      shipmentId,
      imageUrl: uploadResult.secureUrl,
      brandName,
      size,
      condition,
      productWeight,
      note,
      costOfGoodsSold: 0,
      targetPrice: 0,
      listedPrice: 0,
      ...(boxId ? { boxId } : {}),
      insertedBy: userEmail.value,
    })

    $q.notify({
      type: 'positive',
      message: 'Product registered successfully!'
    })

  } catch (err: any) {
    if (uploadResult) {
      await cleanupStockImageAssets({
        imageUrl: uploadResult.secureUrl,
      })
    } else if (pendingDeleteToken) {
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
