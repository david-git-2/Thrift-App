<template>
  <q-page class="bw-page theme-app bg-grey-1">
    <div class="bw-page__stack">
      <div class="row items-center q-mb-sm">
        <q-btn flat round dense icon="ph-regular ph-arrow-left" @click="goBack" />
        <div class="text-h6 text-weight-bold q-ml-xs">{{ $t("stockDetail.title") }}</div>
      </div>

      <PageInitialLoader v-if="loading" type="detail" />

      <template v-else-if="stock">
        <q-card class="app-card q-mb-sm overflow-hidden">
          <q-card-section class="q-pa-sm">
            <div class="app-section-title q-mb-sm">
              <q-icon name="ph-regular ph-camera" />
              {{ $t("stockDetail.overview") }}
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
                :class="[
                  'absolute-top-left',
                  'q-ma-sm',
                  'text-uppercase',
                  'stock-status-chip',
                  getStatusBgClass(stock.status)
                ]"
              >
                {{ $t("status." + stock.status) }}
              </q-chip>
              <div class="row q-gutter-xs justify-center q-mt-sm wrap">
                <q-btn
                  flat
                  dense
                  no-caps
                  icon="ph-regular ph-corners-out"
                  :label="$t('common.actions')"
                  @click="openImagePreview"
                />
                <q-btn
                  flat
                  dense
                  no-caps
                  icon="ph-regular ph-camera"
                  :label="$t('insertStock.scanBarcode')"
                  @click="startCameraCapture"
                />
                <q-btn
                  v-if="canCrop"
                  flat
                  dense
                  no-caps
                  icon="ph-regular ph-crop"
                  :label="$t('common.edit')"
                  @click="startImageCrop"
                />
                <q-btn
                  flat
                  dense
                  no-caps
                  icon="ph-regular ph-upload-simple"
                  :label="$t('common.edit')"
                  @click="fileInput?.click()"
                />
                <q-btn
                  flat
                  dense
                  no-caps
                  color="negative"
                  icon="ph-regular ph-trash"
                  :label="$t('common.delete')"
                  @click="imageRemoveConfirmOpen = true"
                />
              </div>
            </div>
            <div
              v-else
              class="stock-detail-hero__placeholder relative-position text-center q-py-md"
            >
              <q-chip
                dense
                :class="[
                  'absolute-top-left',
                  'q-ma-sm',
                  'text-uppercase',
                  'stock-status-chip',
                  getStatusBgClass(stock.status)
                ]"
              >
                {{ $t("status." + stock.status) }}
              </q-chip>
              <q-icon name="ph-regular ph-image" size="3rem" color="grey-4" />
              <div class="q-mt-md">
                <q-btn
                  color="primary"
                  unelevated
                  icon="ph-regular ph-camera"
                  :label="$t('insertStock.scanBarcode')"
                  no-caps
                  class="app-cta-btn"
                  @click="startCameraCapture"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="app-card q-mb-sm">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-grey-6"
              >{{ stock.shipment_name }} · {{ stock.box_name || "No box" }}</div
            >
            <div class="text-caption text-mono text-grey-7 q-mt-xs">{{
              stock.barcode
            }}</div>
          </q-card-section>
        </q-card>

        <q-form @submit.prevent="saveStock">
          <q-expansion-item
            default-opened
            icon="ph-regular ph-package"
            label="Details"
            class="app-card q-mb-sm"
          >
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
              <q-input
                v-model="form.note"
                outlined
                dense
                type="textarea"
                rows="2"
                label="Note"
              />
            </q-card-section>
          </q-expansion-item>

          <q-expansion-item
            icon="ph-regular ph-tag"
            label="Pricing"
            default-opened
            class="app-card q-mb-sm"
          >
            <q-card-section class="q-gutter-y-sm q-pt-none">
              <div class="text-caption text-grey-7 q-mb-xs">
                Purchase ({{ purchaseCurrency?.code ?? "—" }})
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
                    label="Origin unit price"
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
                    label="Extra origin unit price"
                    :prefix="purchaseCurrencySymbol"
                  />
                </div>
              </div>

              <q-separator class="q-my-sm" />

              <div class="text-caption text-grey-7 q-mb-xs">
                Pricing ({{ costCurrency?.code ?? "—" }})
              </div>
              <q-input
                v-model.number="pricing.listed_unit_price"
                outlined
                dense
                type="number"
                step="1"
                :prefix="costCurrencySymbol"
                label="Listed price"
              />
            </q-card-section>
          </q-expansion-item>

          <q-expansion-item
            icon="ph-regular ph-map-pin"
            label="Location"
            class="app-card q-mb-md"
          >
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
              icon="ph-regular ph-floppy-disk"
              label="Save"
              no-caps
              size="md"
              class="q-px-lg app-cta-btn"
              style="min-height: 40px !important"
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
          <q-card style="width: 350px; max-width: 90vw" class="q-pa-md">
            <q-card-section class="row items-center q-pb-none">
              <q-avatar icon="ph-regular ph-image" color="warning" text-color="white" />
              <span class="q-ml-sm text-weight-bold">Remove product image</span>
            </q-card-section>
            <q-card-section>
              Remove this product image? The change is applied when you save the
              stock item.
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat label="Cancel" color="grey-7" v-close-popup />
              <q-btn
                color="negative"
                label="Remove"
                no-caps
                @click="confirmRemoveImage"
              />
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { Capacitor } from "@capacitor/core";
import { useAuthStore } from "../stores/authStore";
import { useProductPhoto } from "../composables/useProductPhoto";
import {
  uploadStockImage,
  cleanupStockImageAssets,
  type StockImageUploadResult
} from "../utils/stockImageClient";
import { deleteCloudinaryByToken } from "../utils/cloudinaryClient";
import {
  useThriftCurrenciesQuery,
  useCurrencyById
} from "../composables/useThriftCurrenciesQuery";
import {
  useThriftCategoriesQuery,
  useThriftTypesQuery,
  useThriftShelvesQuery
} from "../composables/useThriftCatalogQuery";
import {
  fetchThriftStockById,
  type ThriftStockDetail
} from "../composables/useThriftStockDetail";
import { updateThriftStock } from "../composables/useThriftStockUpdate";
import { useUpdateStockMutation } from "../composables/useThriftStockMutations";
import { refreshShipmentCurrencyIds } from "../composables/useThriftShipment";
import {
  THRIFT_CONDITION_OPTIONS,
  THRIFT_SECTION_OPTIONS
} from "../constants/thriftEnums";
import PageInitialLoader from "../components/PageInitialLoader.vue";
import SmartImage from "../components/SmartImage.vue";

import { useThriftStockDetailQuery } from "../composables/useThriftStockDetailQuery";

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();

useThriftCurrenciesQuery();

const tenantIdRef = computed(() => authStore.tenantId ?? 0);
const categoriesQuery = useThriftCategoriesQuery(tenantIdRef);
const typesQuery = useThriftTypesQuery(tenantIdRef);
const shelvesQuery = useThriftShelvesQuery(tenantIdRef);

const categoryOptions = computed(() => categoriesQuery.data.value || []);
const typeOptions = computed(() => typesQuery.data.value || []);
const shelfOptions = computed(() => shelvesQuery.data.value || []);

const stockId = computed(() => Number(route.params.id));
const stockDetailQuery = useThriftStockDetailQuery(tenantIdRef, stockId);
const updateStockMutation = useUpdateStockMutation();

const { capturePhoto, cropPhoto } = useProductPhoto();

const loading = computed(() => stockDetailQuery.isPending.value);
const saving = ref(false);
const stock = ref<ThriftStockDetail | null>(null);

watch(
  () => stockDetailQuery.data.value,
  async (newDetail) => {
    if (newDetail) {
      stock.value = newDetail;
      populateForm(newDetail);
      if (tenantIdRef.value && newDetail.shipment_id) {
        try {
          const shipment = await refreshShipmentCurrencyIds(
            newDetail.shipment_id,
            tenantIdRef.value
          );
          shipmentCostCurrencyId.value = shipment?.cost_currency_id ?? null;
          shipmentPurchaseCurrencyId.value = shipment?.purchase_currency_id ?? null;
        } catch (err) {
          console.error("Failed to load shipment currency details:", err);
        }
      }
    }
  },
  { immediate: true }
);

watch(
  () => stockDetailQuery.isError.value,
  (isErr) => {
    if (isErr && stockDetailQuery.error.value) {
      const message =
        stockDetailQuery.error.value instanceof Error
          ? stockDetailQuery.error.value.message
          : "Failed to load stock";
      $q.notify({ type: "negative", message });
    }
  }
);

const fileInput = ref<HTMLInputElement | null>(null);
const smartImageRef = ref<InstanceType<typeof SmartImage> | null>(null);
const imageRemoveConfirmOpen = ref(false);
const previewWebPath = ref("");
const webBlob = ref<Blob | null>(null);
const imageRemoved = ref(false);
const originalImageUrl = ref("");
const originalDriveFileId = ref("");
const shipmentCostCurrencyId = ref<number | null>(null);
const shipmentPurchaseCurrencyId = ref<number | null>(null);

const form = ref({
  brand_name: "",
  category_id: null as number | null,
  type_id: null as number | null,
  section: null as string | null,
  shelf_id: null as number | null,
  color: "",
  size: "",
  condition: null as string | null,
  status: "AVAILABLE",
  product_weight: null as number | null,
  extra_weight: null as number | null,
  note: ""
});

const pricing = ref({
  listed_unit_price: 0
});

const originPurchasePrice = ref(0);
const extraOriginPurchaseExpense = ref(0);

const sectionOptions = [...THRIFT_SECTION_OPTIONS];
const conditionOptions = [...THRIFT_CONDITION_OPTIONS];
const statusOptions = ["AVAILABLE", "OUT_OF_STOCK", "DAMAGED", "STOLEN"];

const activeCostCurrencyId = computed(
  () => shipmentCostCurrencyId.value ?? authStore.thriftDefaultCostCurrencyId
);
const activePurchaseCurrencyId = computed(
  () =>
    shipmentPurchaseCurrencyId.value ??
    authStore.thriftDefaultPurchaseCurrencyId
);

const costCurrency = useCurrencyById(activeCostCurrencyId);
const purchaseCurrency = useCurrencyById(activePurchaseCurrencyId);
const costCurrencySymbol = computed(() => costCurrency.value?.symbol ?? "");
const purchaseCurrencySymbol = computed(
  () => purchaseCurrency.value?.symbol ?? ""
);

const canCrop = computed(
  () => Capacitor.isNativePlatform() && !!previewImageUrl.value
);

const previewImageUrl = computed(() => {
  if (imageRemoved.value) return "";
  if (previewWebPath.value) return previewWebPath.value;
  return stock.value?.image_url || "";
});

function revokePreviewUrl() {
  if (previewWebPath.value.startsWith("blob:")) {
    URL.revokeObjectURL(previewWebPath.value);
  }
}

function resetImageEditState(imageUrl: string, driveFileId = "") {
  revokePreviewUrl();
  previewWebPath.value = "";
  webBlob.value = null;
  imageRemoved.value = false;
  originalImageUrl.value = imageUrl || "";
  originalDriveFileId.value = driveFileId || "";
}

const goBack = () => {
  router.push("/stock-list");
};

const getStatusBgClass = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-50 text-emerald-700";
    case "OUT_OF_STOCK":
      return "bg-slate-100 text-slate-700";
    case "DAMAGED":
      return "bg-amber-50 text-amber-700";
    case "STOLEN":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const populateForm = (detail: ThriftStockDetail) => {
  form.value = {
    brand_name: detail.brand_name || "",
    category_id: detail.category_id,
    type_id: detail.type_id,
    section: detail.section,
    shelf_id: detail.shelf_id,
    color: detail.color || "",
    size: detail.size || "",
    condition: detail.condition,
    status: detail.status,
    product_weight: detail.product_weight,
    extra_weight: detail.extra_weight,
    note: detail.note || ""
  };
  pricing.value = {
    listed_unit_price: detail.listed_unit_price
  };
  originPurchasePrice.value = detail.origin_unit_price ?? 0;
  extraOriginPurchaseExpense.value = detail.extra_origin_unit_price ?? 0;
  resetImageEditState(detail.image_url, detail.drive_file_id);
};

const startCameraCapture = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await capturePhoto();
      if (result) {
        revokePreviewUrl();
        previewWebPath.value = result.webPath;
        webBlob.value = result.blob;
        imageRemoved.value = false;
        $q.notify({ type: "positive", message: "Photo captured" });
      }
    } catch (err) {
      console.error("Camera capture error:", err);
      const message = err instanceof Error ? err.message : "Camera error";
      $q.notify({
        type: "negative",
        message: `${message}. Try file upload instead.`
      });
      fileInput.value?.click();
    }
  } else {
    fileInput.value?.click();
  }
};

const startImageCrop = async () => {
  if (!previewImageUrl.value) return;

  if (Capacitor.isNativePlatform()) {
    try {
      const result = await cropPhoto(previewImageUrl.value);
      if (result) {
        revokePreviewUrl();
        previewWebPath.value = result.webPath;
        webBlob.value = result.blob;
        imageRemoved.value = false;
        $q.notify({ type: "positive", message: "Photo cropped" });
      }
    } catch (err) {
      console.error("Crop error:", err);
      const message = err instanceof Error ? err.message : "Crop failed";
      $q.notify({ type: "negative", message });
    }
  } else {
    $q.notify({
      type: "info",
      message: "Crop is only available in the native app"
    });
  }
};

const handleWebFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  revokePreviewUrl();
  webBlob.value = file;
  previewWebPath.value = URL.createObjectURL(file);
  imageRemoved.value = false;
  target.value = "";
  $q.notify({ type: "positive", message: "Photo selected" });
};

const clearImage = () => {
  revokePreviewUrl();
  previewWebPath.value = "";
  webBlob.value = null;
  imageRemoved.value = true;
};

const confirmRemoveImage = () => {
  clearImage();
  imageRemoveConfirmOpen.value = false;
};

const openImagePreview = () => {
  smartImageRef.value?.openLightbox();
};

const saveStock = async () => {
  if (!stock.value) return;
  saving.value = true;
  let pendingDeleteToken = "";
  let orphanUpload: StockImageUploadResult | null = null;
  try {
    let imageUrl: string | null | undefined;
    let driveFilePayload: string | null | undefined;

    if (webBlob.value) {
      const barcode = stock.value.barcode?.trim();
      const tenantId = authStore.tenantId;
      if (!barcode) {
        throw new Error("Barcode is required before uploading an image.");
      }
      if (!tenantId) {
        throw new Error("Workspace is required before uploading an image.");
      }

      const uploaded = await uploadStockImage(webBlob.value, {
        barcode,
        shipmentId: stock.value.shipment_id,
        tenantId,
        stockId: stock.value.id,
        replaceImageUrl: originalImageUrl.value
      });
      orphanUpload = uploaded;
      imageUrl = uploaded.secureUrl;
      driveFilePayload = null;
      pendingDeleteToken = uploaded.deleteToken || "";
    } else if (imageRemoved.value && originalImageUrl.value) {
      imageUrl = null;
      driveFilePayload = null;
    }

    const previousImageUrl = originalImageUrl.value;
    const previousDriveFileId = originalDriveFileId.value;
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
        origin_unit_price: originPurchasePrice.value || null,
        extra_origin_unit_price: extraOriginPurchaseExpense.value || null
      },
      pricing: {
        listed_unit_price: pricing.value.listed_unit_price
      },
      insertedBy: authStore.user?.email || "app-user"
    };

    if (imageUrl !== undefined) {
      updateParams.imageUrl = imageUrl;
      updateParams.driveFileId = driveFilePayload ?? null;
    }

    await updateStockMutation.mutateAsync(updateParams);

    if (imageUrl !== undefined && (previousImageUrl || previousDriveFileId)) {
      const savedUrl = imageUrl || "";
      if (!savedUrl || savedUrl !== previousImageUrl) {
        await cleanupStockImageAssets({
          imageUrl: previousImageUrl
        });
      }
    }

    orphanUpload = null;
    $q.notify({ type: "positive", message: "Stock updated" });
    goBack();
  } catch (err) {
    if (orphanUpload) {
      await cleanupStockImageAssets({
        imageUrl: orphanUpload.secureUrl
      });
    } else if (pendingDeleteToken) {
      await deleteCloudinaryByToken(pendingDeleteToken);
    }
    const message = err instanceof Error ? err.message : "Save failed";
    $q.notify({ type: "negative", message });
  } finally {
    saving.value = false;
  }
};

onBeforeUnmount(() => {
  revokePreviewUrl();
});
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
