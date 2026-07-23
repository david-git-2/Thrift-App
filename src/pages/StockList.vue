<template>
  <q-page class="bw-page theme-app bg-grey-1">
    <div class="bw-page__stack">
      <AppPageHeader
        :title="$t('stockList.title')"
        show-help
        @help="showHelpDialog = true"
      >
        <template #action>
          <q-btn
            color="primary"
            unelevated
            icon="ph-regular ph-plus"
            :label="$t('nav.insert')"
            no-caps
            to="/insert-stock"
            class="app-cta-btn min-tap-target"
            style="min-height: 44px !important; font-size: 0.95rem !important"
          />
        </template>
      </AppPageHeader>

      <q-card class="app-card app-filter-panel glass-surface">
        <q-card-section class="q-pa-sm q-gutter-y-sm">
          <q-input
            v-model="searchQuery"
            outlined
            dense
            :placeholder="$t('stockList.searchPlaceholder')"
            debounce="400"
            class="min-input-target"
            @update:model-value="onSearch"
          >
            <template #append>
              <q-icon name="ph-regular ph-magnifying-glass" color="grey-6" />
            </template>
          </q-input>

          <div class="row q-col-gutter-xs">
            <div class="col-6 col-sm-3">
              <q-select
                v-model="selectedStatus"
                outlined
                dense
                :label="$t('nav.inventory')"
                :options="statusOptions"
                emit-value
                map-options
                class="min-input-target"
                @update:model-value="onFilterChange"
              />
            </div>
            <div class="col-6 col-sm-3">
              <q-select
                v-model="selectedCondition"
                outlined
                dense
                :label="$t('common.filter')"
                :options="conditionOptions"
                emit-value
                map-options
                class="min-input-target"
                @update:model-value="onFilterChange"
              />
            </div>
            <div class="col-6 col-sm-3">
              <q-select
                v-model="selectedShelf"
                outlined
                dense
                :label="$t('stockList.filterByShelf')"
                :options="shelfOptions"
                emit-value
                map-options
                clearable
                class="min-input-target"
                @update:model-value="onShelfChange"
              />
            </div>
            <div class="col-6 col-sm-3">
              <q-select
                v-model="selectedBox"
                outlined
                dense
                :label="$t('stockList.filterByBox')"
                :options="boxOptions"
                emit-value
                map-options
                clearable
                class="min-input-target"
                @update:model-value="onFilterChange"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-pull-to-refresh @refresh="onRefresh" color="primary">
        <!-- Skeleton loaders during initial query fetch -->
        <div v-if="isLoading && stocks.length === 0" class="q-gutter-y-sm">
          <q-card
            v-for="n in 5"
            :key="n"
            class="app-card app-stock-card overflow-hidden"
          >
            <div class="row no-wrap items-stretch">
              <div class="col-4">
                <q-skeleton height="100px" square animation="wave" />
              </div>
              <div class="col-8 q-pa-sm flex flex-col justify-between">
                <div>
                  <q-skeleton type="text" width="35%" animation="wave" />
                  <q-skeleton type="text" width="85%" animation="wave" />
                  <q-skeleton type="text" width="60%" animation="wave" />
                </div>
                <div class="row items-center justify-between q-mt-xs">
                  <q-skeleton type="text" width="40%" animation="wave" />
                </div>
              </div>
            </div>
          </q-card>
        </div>

        <!-- Empty state when no items found -->
        <div
          v-else-if="!isLoading && stocks.length === 0"
          class="app-empty-state"
        >
          <div class="app-empty-state__icon">
            <q-icon name="ph-regular ph-package" size="2rem" />
          </div>
          <div class="text-subtitle1 text-weight-bold text-grey-8">
            {{ $t("stockList.noItemsFound") }}
          </div>
          <div class="text-caption text-grey-6 q-mt-xs">
            {{ $t("stockList.noItemsSubtitle") }}
          </div>
          <q-btn
            color="primary"
            flat
            :label="$t('stockList.clearFilters')"
            no-caps
            class="q-mt-sm min-tap-target"
            @click="clearFilters"
          />
        </div>

        <!-- Stock list -->
        <div v-else class="q-gutter-y-xs">
          <!-- Background fetching indicator -->
          <div v-if="isFetching && stocks.length > 0" class="q-pb-xs">
            <q-linear-progress
              query
              color="primary"
              track-color="transparent"
            />
          </div>

          <q-list class="q-gutter-y-xs">
            <q-slide-item
              v-for="item in stocks"
              :key="item.id"
              left-color="primary"
              right-color="deep-orange-7"
              class="rounded-borders overflow-hidden"
              @left="onSlideLeft(item)"
              @right="onSlideRight(item)"
            >
              <template #left>
                <div
                  class="row items-center q-px-md text-white text-weight-bold"
                >
                  <q-icon name="drive_file_move" size="20px" class="q-mr-xs" />
                  {{ $t("stockDetail.location") }}
                </div>
              </template>
              <template #right>
                <div
                  class="row items-center q-px-md text-white text-weight-bold"
                >
                  {{ $t("common.actions") }}
                  <q-icon
                    name="published_with_changes"
                    size="20px"
                    class="q-ml-xs"
                  />
                </div>
              </template>

              <q-card
                class="app-card app-stock-card overflow-hidden cursor-pointer"
                @click="openStock(item.id)"
              >
                <div class="row no-wrap items-stretch">
                  <div class="col-4 app-stock-card__media relative-position">
                    <q-img
                      v-if="item.image_url"
                      :src="item.image_url"
                      class="full-height fill-image"
                      ratio="1"
                      fit="cover"
                    />
                    <q-icon v-else name="ph-regular ph-image" size="2rem" color="grey-4" />

                    <q-chip
                      dense
                      :class="[
                        'absolute-top-left',
                        'q-ma-xs',
                        'text-uppercase',
                        'stock-status-chip',
                        getStatusBgClass(item.status)
                      ]"
                    >
                      {{ $t("status." + item.status) }}
                    </q-chip>
                  </div>

                  <div class="col-8 q-pa-sm flex flex-col justify-between">
                    <div>
                      <div class="row items-center justify-between no-wrap">
                        <span
                          class="text-caption text-weight-bold text-primary text-uppercase"
                        >
                          {{ item.brand_name || "Generic" }}
                        </span>
                        <q-icon
                          name="chevron_right"
                          size="18px"
                          color="grey-5"
                        />
                      </div>

                      <div
                        class="text-subtitle2 text-weight-bold text-grey-9 ellipsis-2-lines"
                      >
                        {{ item.name || item.brand_name || item.barcode }}
                      </div>

                      <div
                        class="row items-center q-gutter-x-xs text-caption text-grey-6 q-mt-xs"
                      >
                        <span v-if="item.color" class="row items-center">
                          <q-badge
                            rounded
                            :style="{
                              backgroundColor: getBadgeColor(item.color)
                            }"
                            class="q-mr-xs border-light"
                          />
                          {{ item.color }}
                        </span>
                        <span v-if="item.color && item.size">·</span>
                        <span v-if="item.size" class="text-weight-medium text-grey-8">
                          Sz {{ item.size }}
                          <q-tooltip v-if="hasMeasurements(item)" anchor="top middle" self="bottom middle">
                            Measurements: {{ formatMeasurements(item) }}
                          </q-tooltip>
                        </span>
                      </div>
                      <div
                        v-if="hasMeasurements(item)"
                        class="text-caption text-grey-7 q-mt-xs bg-grey-2 rounded-borders q-px-xs q-py-1 text-mono"
                        style="font-size: 0.72rem;"
                      >
                        <q-icon name="straighten" size="12px" color="primary" class="q-mr-xs" />
                        <span>{{ formatMeasurements(item) }}</span>
                      </div>

                      <div
                        class="row items-center bg-grey-2 rounded-borders q-px-xs q-py-xs q-mt-xs min-tap-target cursor-pointer"
                        style="border: 1px dashed var(--q-grey-4, #cbd5e1);"
                        @click.stop="copyBarcode(item.barcode)"
                      >
                        <q-icon
                          name="qr_code_scanner"
                          size="14px"
                          color="primary"
                          class="q-mr-xs"
                        />
                        <span
                          class="text-caption text-mono text-weight-medium text-grey-9 text-xs truncate col"
                        >
                          {{ item.barcode }}
                        </span>
                        <q-icon
                          name="content_copy"
                          size="14px"
                          color="grey-6"
                          class="q-ml-xs"
                        />
                      </div>
                    </div>

                    <div class="row items-center justify-between q-mt-xs pt-xs border-top-light">
                      <span class="text-caption text-grey-6 text-weight-medium">Listed Price</span>
                      <div class="text-subtitle1 text-weight-bolder text-primary">
                        {{ formatPrice(item.listed_price, item) }}
                      </div>
                    </div>
                  </div>
                </div>
              </q-card>
            </q-slide-item>
          </q-list>

          <!-- Move Location Dialog -->
          <q-dialog v-model="showMoveDialog" persistent>
            <q-card style="min-width: 320px" class="q-pa-sm rounded-borders">
              <q-card-section class="row items-center q-pb-none">
                <div class="text-subtitle1 text-weight-bold"
                  >Move Stock Location</div
                >
                <q-space />
                <q-btn
                  icon="close"
                  flat
                  round
                  dense
                  v-close-popup
                  class="min-tap-target"
                />
              </q-card-section>

              <q-card-section class="q-pt-sm q-gutter-y-sm" v-if="targetStock">
                <div class="text-caption text-grey-7">
                  Item:
                  <span class="text-weight-bold text-grey-9">{{
                    targetStock.name || targetStock.barcode
                  }}</span>
                </div>
                <q-select
                  v-model="dialogShelfId"
                  outlined
                  dense
                  label="Select Shelf"
                  :options="shelfOptions"
                  emit-value
                  map-options
                  clearable
                  class="min-input-target"
                  @update:model-value="onDialogShelfChange"
                />
                <q-select
                  v-model="dialogBoxId"
                  outlined
                  dense
                  label="Select Box"
                  :options="dialogBoxOptions"
                  emit-value
                  map-options
                  clearable
                  class="min-input-target"
                />
              </q-card-section>

              <q-card-actions align="right">
                <q-btn
                  flat
                  label="Cancel"
                  v-close-popup
                  no-caps
                  class="min-tap-target"
                />
                <q-btn
                  color="primary"
                  label="Save Location"
                  no-caps
                  :loading="updateLocationMutation.isPending.value"
                  class="min-tap-target"
                  @click="saveLocation"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>

          <!-- Change Status Dialog -->
          <q-dialog v-model="showStatusDialog" persistent>
            <q-card style="min-width: 300px" class="q-pa-sm rounded-borders">
              <q-card-section class="row items-center q-pb-none">
                <div class="text-subtitle1 text-weight-bold"
                  >Change Stock Status</div
                >
                <q-space />
                <q-btn
                  icon="close"
                  flat
                  round
                  dense
                  v-close-popup
                  class="min-tap-target"
                />
              </q-card-section>

              <q-card-section class="q-pt-sm q-gutter-y-sm" v-if="targetStock">
                <div class="text-caption text-grey-7 q-mb-xs">
                  Item:
                  <span class="text-weight-bold text-grey-9">{{
                    targetStock.name || targetStock.barcode
                  }}</span>
                </div>
                <q-select
                  v-model="dialogStatus"
                  outlined
                  dense
                  label="Status"
                  :options="dialogStatusOptions"
                  emit-value
                  map-options
                  class="min-input-target"
                />
              </q-card-section>

              <q-card-actions align="right">
                <q-btn
                  flat
                  label="Cancel"
                  v-close-popup
                  no-caps
                  class="min-tap-target"
                />
                <q-btn
                  color="primary"
                  label="Update Status"
                  no-caps
                  :loading="updateStatusMutation.isPending.value"
                  class="min-tap-target"
                  @click="saveStatus"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>

          <!-- Pagination -->
          <div v-if="meta.total_pages > 1" class="flex flex-center q-py-sm">
            <q-pagination
              v-model="page"
              :max="meta.total_pages"
              :max-pages="5"
              direction-links
              color="primary"
            />
          </div>
        </div>
      </q-pull-to-refresh>
    </div>

    <!-- Stock List Help Dialog -->
    <AppHelpDialog
      v-model="showHelpDialog"
      :title="$t('help.stockList.title')"
      :subtitle="$t('help.stockList.subtitle')"
      icon="ph-regular ph-package"
      :steps="helpSteps"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "../stores/authStore";
import AppHelpDialog, { type HelpStep } from "../components/AppHelpDialog.vue";
import { useThriftCurrenciesQuery } from "../composables/useThriftCurrenciesQuery";
import { type ThriftStockListItem } from "../composables/useThriftStockList";
import { useThriftStockListQuery } from "../composables/useThriftStockListQuery";
import {
  useThriftShelvesQuery,
  useThriftBoxesQuery
} from "../composables/useThriftCatalogQuery";
import { fetchShipmentCostCurrencyMapForIds } from "../composables/useThriftShipment";
import {
  useUpdateStockStatusMutation,
  useUpdateStockLocationMutation
} from "../composables/useThriftStockMutations";
import { formatThriftAmount } from "../utils/formatThriftAmount";
import { THRIFT_CONDITION_FILTER_OPTIONS } from "../constants/thriftEnums";
import { thriftQueryKeys } from "../queryKeys/thriftQueryKeys";
import AppPageHeader from "../components/AppPageHeader.vue";

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const { t } = useI18n();

const showHelpDialog = ref(false);

const helpSteps = computed<HelpStep[]>(() => [
  {
    title: t("help.stockList.steps.step1Title"),
    description: t("help.stockList.steps.step1Desc"),
  },
  {
    title: t("help.stockList.steps.step2Title"),
    description: t("help.stockList.steps.step2Desc"),
  },
  {
    title: t("help.stockList.steps.step3Title"),
    description: t("help.stockList.steps.step3Desc"),
  },
]);

const { data: currencies } = useThriftCurrenciesQuery();

const tenantId = computed(() => authStore.tenantId);
const page = ref(1);
const pageSize = 20;
const searchQuery = ref("");
const selectedStatus = ref<string | null>("AVAILABLE");
const selectedCondition = ref<string | null>(null);
const selectedShelf = ref<number | null>(null);
const selectedBox = ref<number | null>(null);

// Fetch shelves & boxes with TanStack Query
const shelvesQuery = useThriftShelvesQuery(tenantId);
const boxesQuery = useThriftBoxesQuery(tenantId, selectedShelf);

const shelfOptions = computed(() => [
  { label: "All shelves", value: null },
  ...(shelvesQuery.data.value?.map(s => ({
    label: s.shelf_code,
    value: s.id
  })) ?? [])
]);

const boxOptions = computed(() => [
  { label: "All boxes", value: null },
  ...(boxesQuery.data.value?.map(b => ({ label: b.box_code, value: b.id })) ??
    [])
]);

const { data, isLoading, isFetching, refetch } = useThriftStockListQuery({
  tenantId,
  page,
  pageSize,
  search: searchQuery,
  status: selectedStatus,
  condition: selectedCondition,
  shelfId: selectedShelf,
  boxId: selectedBox
});

const stocks = computed<ThriftStockListItem[]>(() => data.value?.data ?? []);
const meta = computed(
  () =>
    data.value?.meta ?? {
      total: 0,
      page: 1,
      page_size: pageSize,
      total_pages: 0
    }
);

const shipmentCurrencyMap = ref<Map<number, number>>(new Map());

const statusOptions = [
  { label: "All statuses", value: null },
  { label: "Available", value: "AVAILABLE" },
  { label: "Out of stock", value: "OUT_OF_STOCK" },
  { label: "Damaged", value: "DAMAGED" },
  { label: "Stolen", value: "STOLEN" }
];

const dialogStatusOptions = [
  { label: "Available", value: "AVAILABLE" },
  { label: "Out of stock", value: "OUT_OF_STOCK" },
  { label: "Damaged", value: "DAMAGED" },
  { label: "Stolen", value: "STOLEN" }
];

const conditionOptions = [
  { label: "All conditions", value: null },
  ...THRIFT_CONDITION_FILTER_OPTIONS
];

// Quick Action Dialogs State
const showMoveDialog = ref(false);
const showStatusDialog = ref(false);
const targetStock = ref<ThriftStockListItem | null>(null);

const dialogShelfId = ref<number | null>(null);
const dialogBoxId = ref<number | null>(null);
const dialogStatus = ref<string>("AVAILABLE");

const dialogBoxesQuery = useThriftBoxesQuery(tenantId, dialogShelfId);

const dialogBoxOptions = computed(() => [
  { label: "None", value: null },
  ...(dialogBoxesQuery.data.value?.map(b => ({
    label: b.box_code,
    value: b.id
  })) ?? [])
]);

const updateStatusMutation = useUpdateStockStatusMutation();
const updateLocationMutation = useUpdateStockLocationMutation();

const onSlideLeft = (item: ThriftStockListItem) => {
  // Swipe right action -> Move Location
  targetStock.value = item;
  dialogShelfId.value =
    (item as unknown as { shelf_id?: number | null }).shelf_id ?? null;
  dialogBoxId.value =
    (item as unknown as { box_id?: number | null }).box_id ?? null;
  showMoveDialog.value = true;
};

const onSlideRight = (item: ThriftStockListItem) => {
  // Swipe left action -> Change Status
  targetStock.value = item;
  dialogStatus.value = item.status || "AVAILABLE";
  showStatusDialog.value = true;
};

const onDialogShelfChange = () => {
  dialogBoxId.value = null;
};

const saveLocation = async () => {
  if (!targetStock.value) return;
  try {
    await updateLocationMutation.mutateAsync({
      stockId: targetStock.value.id,
      shelfId: dialogShelfId.value,
      boxId: dialogBoxId.value
    });
    $q.notify({ type: "positive", message: "Location updated successfully" });
    showMoveDialog.value = false;
  } catch (err) {
    console.error("Failed to update location:", err);
    $q.notify({ type: "negative", message: "Failed to update location" });
  }
};

const saveStatus = async () => {
  if (!targetStock.value) return;
  try {
    await updateStatusMutation.mutateAsync({
      stockId: targetStock.value.id,
      status: dialogStatus.value
    });
    $q.notify({ type: "positive", message: "Status updated successfully" });
    showStatusDialog.value = false;
  } catch (err) {
    console.error("Failed to update status:", err);
    $q.notify({ type: "negative", message: "Failed to update status" });
  }
};

const currencyForStock = (item: ThriftStockListItem) => {
  const currencyId =
    shipmentCurrencyMap.value.get(item.shipment_id) ??
    authStore.thriftDefaultCostCurrencyId;
  if (currencyId == null) return undefined;
  return currencies.value?.find(c => c.id === currencyId);
};

const formatPrice = (amount: number, item: ThriftStockListItem) =>
  formatThriftAmount(amount, currencyForStock(item));

const openStock = (id: number) => {
  router.push({ name: "stock-detail", params: { id } });
};

// Fetch auxiliary shipment currency mapping when stocks update
watch(
  stocks,
  async newStocks => {
    const activeTenantId = authStore.tenantId;
    if (!activeTenantId || newStocks.length === 0) return;

    const shipmentIds = newStocks.map(item => item.shipment_id);

    try {
      const map = await fetchShipmentCostCurrencyMapForIds(
        activeTenantId,
        shipmentIds
      );
      shipmentCurrencyMap.value = new Map([
        ...shipmentCurrencyMap.value,
        ...map
      ]);
    } catch (err) {
      console.warn("Failed to load shipment currencies:", err);
    }
  },
  { immediate: true }
);

const onRefresh = async (done: () => void) => {
  await refetch();
  done();
};

const onSearch = () => {
  page.value = 1;
};

const onFilterChange = () => {
  page.value = 1;
};

const onShelfChange = () => {
  selectedBox.value = null;
  page.value = 1;
};

const clearFilters = () => {
  searchQuery.value = "";
  selectedStatus.value = "AVAILABLE";
  selectedCondition.value = null;
  selectedShelf.value = null;
  selectedBox.value = null;
  page.value = 1;
};

// Essential measurements parser (Bust/Chest, Length, Waist, Hips, Sleeve, Shoulder, etc.)
const parseMeasurements = (item: ThriftStockListItem) => {
  const results: Array<{ label: string; value: string }> = [];

  // 1. Check structured measurements object from database/API
  if (item.measurements && typeof item.measurements === "object") {
    const m = item.measurements;
    if (m.bust_in != null) results.push({ label: "Bust", value: `${m.bust_in}"` });
    if (m.length_in != null) results.push({ label: "Length", value: `${m.length_in}"` });
    if (m.waist_in != null) results.push({ label: "Waist", value: `${m.waist_in}"` });
    if (m.hips_in != null) results.push({ label: "Hips", value: `${m.hips_in}"` });
    if (m.shoulder_width_in != null) results.push({ label: "Shoulder", value: `${m.shoulder_width_in}"` });
    if (m.sleeve_length_in != null) results.push({ label: "Sleeve", value: `${m.sleeve_length_in}"` });
    if (m.hem_width_in != null) results.push({ label: "Hem", value: `${m.hem_width_in}"` });
    if (m.neck_opening_in != null) results.push({ label: "Neck", value: `${m.neck_opening_in}"` });
    if (m.arm_circumference_in != null) results.push({ label: "Arm", value: `${m.arm_circumference_in}"` });
    
    // Style attributes if present
    if (m.neckline) results.push({ label: "Neckline", value: m.neckline });
    if (m.dress_style) results.push({ label: "Style", value: m.dress_style });
    if (m.sleeve_type) results.push({ label: "Sleeve Type", value: m.sleeve_type });
    if (m.closure_type) results.push({ label: "Closure", value: m.closure_type });
    if (m.lining != null) results.push({ label: "Lining", value: m.lining ? "Yes" : "No" });
  }

  // 2. Fallback to parsing size string if structured object returns empty
  if (results.length === 0 && item.size) {
    const sizeStr = item.size;
    const chestMatch = sizeStr.match(/(?:chest|bust|c)\s*[:=-]?\s*(\d+(?:\.\d+)?(?:"|in|cm)?)/i);
    const lengthMatch = sizeStr.match(/(?:length|len|l)\s*[:=-]?\s*(\d+(?:\.\d+)?(?:"|in|cm)?)/i);
    const waistMatch = sizeStr.match(/(?:waist|w)\s*[:=-]?\s*(\d+(?:\.\d+)?(?:"|in|cm)?)/i);
    const fourthMatch = sizeStr.match(/(?:inseam|shoulder|sleeve|hip|thigh|ins|sh|sl|h)\s*[:=-]?\s*(\d+(?:\.\d+)?(?:"|in|cm)?)/i);

    if (chestMatch?.[1]) results.push({ label: "Chest", value: chestMatch[1] });
    if (lengthMatch?.[1]) results.push({ label: "Length", value: lengthMatch[1] });
    if (waistMatch?.[1]) results.push({ label: "Waist", value: waistMatch[1] });
    if (fourthMatch?.[1]) {
      const rawTag = sizeStr.match(/(inseam|shoulder|sleeve|hip|thigh|ins|sh|sl|h)/i)?.[0]?.toLowerCase() ?? "inseam";
      const label = rawTag.startsWith("sh") ? "Shoulder" : rawTag.startsWith("sl") ? "Sleeve" : rawTag.startsWith("h") ? "Hip" : "Inseam";
      results.push({ label, value: fourthMatch[1] });
    }

    if (results.length === 0) {
      const dimMatches = [...sizeStr.matchAll(/(\d+(?:\.\d+)?(?:"|in|cm)?)/g)]
        .map(m => m[1])
        .filter((val): val is string => typeof val === "string" && val.length > 0);
      const labels = ["Bust/Chest", "Length", "Waist", "Inseam"];
      dimMatches.slice(0, 4).forEach((val, idx) => {
        if (val && labels[idx]) {
          results.push({ label: labels[idx], value: val });
        }
      });
    }
  }

  return results;
};

const hasMeasurements = (item: ThriftStockListItem): boolean => {
  return parseMeasurements(item).length > 0;
};

const formatMeasurements = (item: ThriftStockListItem): string => {
  const items = parseMeasurements(item);
  if (items.length === 0) return "";
  return items.map(m => `${m.label}: ${m.value}`).join(" · ");
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

const copyBarcode = (barcode: string | null) => {
  if (!barcode) return;
  navigator.clipboard.writeText(barcode);
  $q.notify({
    type: "positive",
    message: "Barcode copied",
    timeout: 1000
  });
};

const getBadgeColor = (colorName: string) => {
  const name = colorName?.toLowerCase().trim();
  if (!name) return "transparent";

  const map: Record<string, string> = {
    black: "#000000",
    white: "#ffffff",
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#10b981",
    yellow: "#f59e0b",
    orange: "#f97316",
    purple: "#8b5cf6",
    pink: "#ec4899",
    grey: "#6b7280",
    gray: "#6b7280",
    brown: "#78350f",
    navy: "#1e3a8a"
  };

  return map[name] || "#9ca3af";
};
</script>

<style scoped>
.fill-image {
  object-fit: cover;
}

.border-light {
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.stock-chip {
  font-size: 9px;
  height: 18px;
  letter-spacing: 0.5px;
}

/* High Contrast Status Backgrounds */
.bg-emerald-7 {
  background-color: #15803d !important;
}

.bg-grey-8 {
  background-color: #374151 !important;
}

.bg-amber-9 {
  background-color: #b45309 !important;
}

.bg-red-9 {
  background-color: #b91c1c !important;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Accessible minimum 44px tap targets */
.min-tap-target {
  min-height: 44px;
}

.min-input-target :deep(.q-field__control) {
  min-height: 44px !important;
}
</style>
