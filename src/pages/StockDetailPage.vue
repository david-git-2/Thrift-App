<template>
  <q-page class="bw-page theme-app">
    <div class="bw-page__stack">
      <div class="row items-center q-mb-sm">
        <q-btn flat round dense icon="arrow_back" @click="goBack" />
        <div class="text-h6 text-weight-bold q-ml-xs">Edit stock</div>
      </div>

      <PageInitialLoader v-if="loading" />

      <template v-else-if="stock">
        <q-card class="app-card q-mb-sm overflow-hidden">
          <q-card-section class="q-pa-sm">
            <div class="app-section-title q-mb-sm">
              <q-icon name="photo_camera" />
              Product image
            </div>
            <div v-if="previewImageUrl" class="relative-position">
              <div class="stock-detail-image rounded-borders overflow-hidden">
                <SmartImage
                  ref="smartImageRef"
                  :src="previewImageUrl"
                  :alt="stock.brand_name || stock.barcode || 'Product image'"
                  img-class="stock-detail-image__img"
                />
              </div>
              <q-chip
                dense
                :color="statusColor(stock.status)"
                text-color="white"
                class="absolute-top-left q-ma-sm text-uppercase text-weight-bold"
              >
                {{ stock.status }}
              </q-chip>
              <div class="row q-gutter-xs justify-center q-mt-sm wrap">
                <q-btn
                  flat
                  dense
                  no-caps
                  icon="fullscreen"
                  label="View"
                  @click="openImagePreview"
                />
                <q-btn
                  flat
                  dense
                  no-caps
                  icon="camera_alt"
                  label="Retake"
                  @click="startCameraCapture"
                />
                <q-btn
                  v-if="canCrop"
                  flat
                  dense
                  no-caps
                  icon="crop"
                  label="Crop"
                  @click="startImageCrop"
                />
                <q-btn
                  flat
                  dense
                  no-caps
                  icon="upload"
                  label="Replace"
                  @click="fileInput?.click()"
                />
                <q-btn
                  flat
                  dense
                  no-caps
                  color="negative"
                  icon="delete"
                  label="Remove"
                  @click="imageRemoveConfirmOpen = true"
                />
              </div>
            </div>
            <div v-else class="stock-detail-hero__placeholder relative-position text-center q-py-md">
              <q-chip
                dense
                :color="statusColor(stock.status)"
                text-color="white"
                class="absolute-top-left q-ma-sm text-uppercase text-weight-bold"
              >
                {{ stock.status }}
              </q-chip>
              <q-icon name="image" size="3rem" color="grey-4" />
              <div class="q-mt-md">
                <q-btn
                  color="primary"
                  unelevated
                  icon="camera_alt"
                  label="Take photo"
                  no-caps
                  class="app-cta-btn"
                  @click="startCameraCapture"
                />
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">Capture or upload a product photo</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="app-card q-mb-sm">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-grey-6">{{ stock.shipment_name }} · {{ stock.box_name || 'No box' }}</div>
            <div class="text-caption text-mono text-grey-7 q-mt-xs">{{ stock.barcode }}</div>
          </q-card-section>
        </q-card>

        <q-form @submit.prevent="saveStock">
          <q-expansion-item default-opened icon="inventory_2" label="Details" class="app-card q-mb-sm">
            <q-card-section class="q-gutter-y-sm q-pt-none">
              <q-input v-model="form.brand_name" outlined dense label="Brand" />
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
                label="Category"
              />
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
                label="Style"
              />
              <q-select
                v-model="form.section"
                :options="sectionOptions"
                outlined
                dense
                clearable
                label="Section"
              />
              <q-select
                v-model="form.condition"
                :options="conditionOptions"
                outlined
                dense
                label="Condition"
              />
              <q-select
                v-model="form.status"
                :options="statusOptions"
                outlined
                dense
                label="Status"
              />
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-input v-model="form.color" outlined dense label="Color" />
                </div>
                <div class="col-6">
                  <q-input v-model="form.size" outlined dense label="Size" />
                </div>
              </div>
              <q-input v-model="form.note" outlined dense type="textarea" rows="2" label="Note" />
            </q-card-section>
          </q-expansion-item>

          <q-expansion-item icon="sell" label="Pricing" default-opened class="app-card q-mb-sm">
            <q-card-section class="q-gutter-y-sm q-pt-none">
              <div class="text-caption text-grey-7 q-mb-xs">
                Purchase ({{ purchaseCurrency?.code ?? '—' }})
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model.number="originPurchasePrice"
                    outlined
                    dense
                    type="number"
                    step="0.01"
                    min="0"
                    label="Origin purchase price"
                    :prefix="purchaseCurrencySymbol"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model.number="extraOriginPurchaseExpense"
                    outlined
                    dense
                    type="number"
                    step="0.01"
                    min="0"
                    label="Extra origin purchase expense"
                    :prefix="purchaseCurrencySymbol"
                  />
                </div>
              </div>

              <q-separator class="q-my-sm" />

              <div class="text-caption text-grey-7 q-mb-xs">
                Cost / pricing ({{ costCurrency?.code ?? '—' }})
              </div>
              <q-input
                v-model.number="pricing.cost_of_goods_sold"
                outlined
                dense
                type="number"
                step="0.01"
                :prefix="costCurrencySymbol"
                label="COGS cost"
              />
              <q-input
                v-model.number="pricing.extra_expense_cost"
                outlined
                dense
                type="number"
                step="0.01"
                min="0"
                :prefix="costCurrencySymbol"
                label="Extra expense cost"
              />
              <q-input
                v-model.number="pricing.target_price"
                outlined
                dense
                type="number"
                step="0.01"
                :prefix="costCurrencySymbol"
                label="Target price"
              />
              <q-input
                v-model.number="pricing.listed_price"
                outlined
                dense
                type="number"
                step="0.01"
                :prefix="costCurrencySymbol"
                label="Listed price"
              />
            </q-card-section>
          </q-expansion-item>

          <q-expansion-item icon="place" label="Location" class="app-card q-mb-md">
            <q-card-section class="q-gutter-y-sm q-pt-none">
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
                label="Shelf"
              />
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-input
                    v-model.number="form.product_weight"
                    outlined
                    dense
                    type="number"
                    label="Weight (g)"
                  />
                </div>
                <div class="col-6">
                  <q-input
                    v-model.number="form.extra_weight"
                    outlined
                    dense
                    type="number"
                    label="Extra (g)"
                  />
                </div>
              </div>
            </q-card-section>
          </q-expansion-item>

          <div class="row justify-end q-mt-md q-mb-lg">
            <q-btn
              type="submit"
              color="primary"
              icon="save"
              label="Save"
              no-caps
              size="md"
              class="q-px-lg app-cta-btn"
              style="min-height: 40px !important;"
              :loading="saving"
            />
          </div>
        </q-form>

        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleWebFileChange"
        />

        <q-dialog v-model="imageRemoveConfirmOpen" persistent>
          <q-card style="width: 350px; max-width: 90vw;" class="q-pa-md">
            <q-card-section class="row items-center q-pb-none">
              <q-avatar icon="image" color="warning" text-color="white" />
              <span class="q-ml-sm text-weight-bold">Remove product image</span>
            </q-card-section>
            <q-card-section>
              Remove this product image? The change is applied when you save the stock item.
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat label="Cancel" color="grey-7" v-close-popup />
              <q-btn color="negative" label="Remove" no-caps @click="confirmRemoveImage" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </template>
    </div>

    <PageInitialLoader
      v-if="saving"
      overlay
      message="Uploading image and saving stock..."
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { Capacitor } from '@capacitor/core'
import { useAuthStore } from '../stores/authStore'
import { useProductPhoto } from '../composables/useProductPhoto'
import { uploadToCloudinary } from '../composables/useThriftStockRegister'
import {
  deleteCloudinaryByToken,
  deleteCloudinaryImage,
} from '../utils/cloudinaryClient'
import {
  fetchThriftCategories,
  fetchThriftShelves,
  fetchThriftTypes,
  type ThriftCatalogOption,
} from '../composables/useThriftCatalog'
import { useThriftCurrencyStore } from '../stores/thriftCurrencyStore'
import { fetchThriftStockById, type ThriftStockDetail } from '../composables/useThriftStockDetail'
import { updateThriftStock } from '../composables/useThriftStockUpdate'
import { refreshShipmentCurrencyIds } from '../composables/useThriftShipment'
import {
  THRIFT_CONDITION_OPTIONS,
  THRIFT_SECTION_OPTIONS,
} from '../constants/thriftEnums'
import PageInitialLoader from '../components/PageInitialLoader.vue'
import SmartImage from '../components/SmartImage.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const currencyStore = useThriftCurrencyStore()

const { capturePhoto, cropPhoto } = useProductPhoto()

const loading = ref(true)
const saving = ref(false)
const stock = ref<ThriftStockDetail | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const smartImageRef = ref<InstanceType<typeof SmartImage> | null>(null)
const imageRemoveConfirmOpen = ref(false)
const previewWebPath = ref('')
const webBlob = ref<Blob | null>(null)
const imageRemoved = ref(false)
const originalImageUrl = ref('')
const shipmentCostCurrencyId = ref<number | null>(null)
const shipmentPurchaseCurrencyId = ref<number | null>(null)

const categoryOptions = ref<ThriftCatalogOption[]>([])
const typeOptions = ref<ThriftCatalogOption[]>([])
const shelfOptions = ref<Array<{ id: number; shelf_code: string }>>([])

const form = ref({
  brand_name: '',
  category_id: null as number | null,
  type_id: null as number | null,
  section: null as string | null,
  shelf_id: null as number | null,
  color: '',
  size: '',
  condition: null as string | null,
  status: 'AVAILABLE',
  product_weight: null as number | null,
  extra_weight: null as number | null,
  note: '',
})

const pricing = ref({
  cost_of_goods_sold: 0,
  target_price: 0,
  listed_price: 0,
  extra_expense_cost: 0,
})

const originPurchasePrice = ref(0)
const extraOriginPurchaseExpense = ref(0)

const sectionOptions = [...THRIFT_SECTION_OPTIONS]
const conditionOptions = [...THRIFT_CONDITION_OPTIONS]
const statusOptions = ['AVAILABLE', 'OUT_OF_STOCK', 'DAMAGED', 'STOLEN']

const costCurrency = computed(() => {
  const id = shipmentCostCurrencyId.value ?? authStore.thriftDefaultCostCurrencyId
  return currencyStore.currencyById(id)
})
const purchaseCurrency = computed(() => {
  const id = shipmentPurchaseCurrencyId.value ?? authStore.thriftDefaultPurchaseCurrencyId
  return currencyStore.currencyById(id)
})
const costCurrencySymbol = computed(() => costCurrency.value?.symbol ?? '')
const purchaseCurrencySymbol = computed(() => purchaseCurrency.value?.symbol ?? '')

const stockId = computed(() => Number(route.params.id))

const canCrop = computed(() => Capacitor.isNativePlatform() && !!previewImageUrl.value)

const previewImageUrl = computed(() => {
  if (imageRemoved.value) return ''
  if (previewWebPath.value) return previewWebPath.value
  return stock.value?.image_url || ''
})

function revokePreviewUrl() {
  if (previewWebPath.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewWebPath.value)
  }
}

function resetImageEditState(imageUrl: string) {
  revokePreviewUrl()
  previewWebPath.value = ''
  webBlob.value = null
  imageRemoved.value = false
  originalImageUrl.value = imageUrl || ''
}

const goBack = () => {
  router.push('/stock-list')
}

const statusColor = (status: string) => {
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

const populateForm = (detail: ThriftStockDetail) => {
  form.value = {
    brand_name: detail.brand_name || '',
    category_id: detail.category_id,
    type_id: detail.type_id,
    section: detail.section,
    shelf_id: detail.shelf_id,
    color: detail.color || '',
    size: detail.size || '',
    condition: detail.condition,
    status: detail.status,
    product_weight: detail.product_weight,
    extra_weight: detail.extra_weight,
    note: detail.note || '',
  }
  pricing.value = {
    cost_of_goods_sold: detail.cost_of_goods_sold,
    target_price: detail.target_price,
    listed_price: detail.listed_price,
    extra_expense_cost: detail.extra_expense_cost,
  }
  originPurchasePrice.value = detail.origin_purchase_price ?? 0
  extraOriginPurchaseExpense.value = detail.extra_origin_purchase_expense ?? 0
  resetImageEditState(detail.image_url)
}

const startCameraCapture = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await capturePhoto()
      if (result) {
        revokePreviewUrl()
        previewWebPath.value = result.webPath
        webBlob.value = result.blob
        imageRemoved.value = false
        $q.notify({ type: 'positive', message: 'Photo captured' })
      }
    } catch (err) {
      console.error('Camera capture error:', err)
      const message = err instanceof Error ? err.message : 'Camera error'
      $q.notify({ type: 'negative', message: `${message}. Try file upload instead.` })
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
        revokePreviewUrl()
        previewWebPath.value = result.webPath
        webBlob.value = result.blob
        imageRemoved.value = false
        $q.notify({ type: 'positive', message: 'Photo cropped' })
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
  const file = target.files?.[0]
  if (!file) return

  revokePreviewUrl()
  webBlob.value = file
  previewWebPath.value = URL.createObjectURL(file)
  imageRemoved.value = false
  target.value = ''
  $q.notify({ type: 'positive', message: 'Photo selected' })
}

const clearImage = () => {
  revokePreviewUrl()
  previewWebPath.value = ''
  webBlob.value = null
  imageRemoved.value = true
}

const confirmRemoveImage = () => {
  clearImage()
  imageRemoveConfirmOpen.value = false
}

const openImagePreview = () => {
  smartImageRef.value?.openLightbox()
}

const loadStock = async () => {
  const tenantId = authStore.tenantId
  if (!tenantId) {
    $q.notify({ type: 'negative', message: 'No workspace selected' })
    loading.value = false
    return
  }

  if (!Number.isFinite(stockId.value) || stockId.value <= 0) {
    $q.notify({ type: 'negative', message: 'Invalid stock item' })
    loading.value = false
    goBack()
    return
  }

  loading.value = true
  try {
    const detail = await fetchThriftStockById(tenantId, stockId.value)
    if (!detail) {
      $q.notify({ type: 'warning', message: 'Stock item not found' })
      goBack()
      return
    }

    stock.value = detail
    populateForm(detail)

    await Promise.all([
      currencyStore.loadCurrencies(),
      fetchThriftCategories(tenantId).then((r) => {
        categoryOptions.value = r
      }),
      fetchThriftTypes(tenantId).then((r) => {
        typeOptions.value = r
      }),
      fetchThriftShelves(tenantId).then((r) => {
        shelfOptions.value = r
      }),
    ])

    const shipment = await refreshShipmentCurrencyIds(detail.shipment_id, tenantId)
    shipmentCostCurrencyId.value = shipment?.cost_currency_id ?? null
    shipmentPurchaseCurrencyId.value = shipment?.purchase_currency_id ?? null
  } catch (err) {
    console.error('Load stock failed:', err)
    const message =
      err instanceof Error ? err.message : 'Failed to load stock'
    $q.notify({ type: 'negative', message })
  } finally {
    loading.value = false
  }
}

const saveStock = async () => {
  if (!stock.value) return
  saving.value = true
  let pendingDeleteToken = ''
  try {
    let imageUrl: string | null | undefined

    if (webBlob.value) {
      const imgName = `stock-${stock.value.id}-${Date.now()}`
      const uploadResult = await uploadToCloudinary(webBlob.value, imgName)
      imageUrl = uploadResult.secureUrl
      pendingDeleteToken = uploadResult.deleteToken || ''
    } else if (imageRemoved.value && originalImageUrl.value) {
      imageUrl = null
    }

    const previousImageUrl = originalImageUrl.value
    const updateParams: Parameters<typeof updateThriftStock>[0] = {
      stockId: stock.value.id,
      stock: {
        brand_name: form.value.brand_name || null,
        category_id: form.value.category_id,
        type_id: form.value.type_id,
        section: form.value.section,
        shelf_id: form.value.shelf_id,
        color: form.value.color || null,
        size: form.value.size || null,
        condition: form.value.condition,
        status: form.value.status,
        product_weight: form.value.product_weight,
        extra_weight: form.value.extra_weight,
        note: form.value.note || null,
        origin_purchase_price: originPurchasePrice.value || null,
        extra_origin_purchase_expense: extraOriginPurchaseExpense.value || null,
      },
      pricing: pricing.value,
      insertedBy: authStore.user?.email || 'app-user',
    }

    if (imageUrl !== undefined) {
      updateParams.imageUrl = imageUrl
    }

    await updateThriftStock(updateParams)

    if (imageUrl !== undefined && previousImageUrl) {
      const savedUrl = imageUrl || ''
      if (!savedUrl || savedUrl !== previousImageUrl) {
        await deleteCloudinaryImage(previousImageUrl)
      }
    }

    $q.notify({ type: 'positive', message: 'Stock updated' })
    goBack()
  } catch (err) {
    if (pendingDeleteToken) {
      await deleteCloudinaryByToken(pendingDeleteToken)
    }
    const message = err instanceof Error ? err.message : 'Save failed'
    $q.notify({ type: 'negative', message })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadStock()
})

onBeforeUnmount(() => {
  revokePreviewUrl()
})
</script>

<style scoped>
.stock-detail-hero__placeholder {
  aspect-ratio: 4 / 3;
}

.stock-detail-image {
  aspect-ratio: 4 / 3;
  background: #f5f5f5;
}

.stock-detail-image__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
