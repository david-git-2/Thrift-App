<template>
  <q-page class="bw-page theme-app">
    <div class="bw-page__stack">
      <AppPageHeader title="Stock">
        <template #action>
          <q-btn
            color="primary"
            unelevated
            icon="add"
            label="Add"
            no-caps
            to="/insert-stock"
            class="app-cta-btn"
            style="min-height: 40px !important; font-size: 0.9rem !important"
          />
        </template>
      </AppPageHeader>

      <q-card class="app-card app-filter-panel">
        <q-card-section class="q-pa-sm q-gutter-y-sm">
          <q-input
            v-model="searchQuery"
            outlined
            dense
            placeholder="Search name, brand, barcode..."
            debounce="400"
            @update:model-value="onSearch"
          >
            <template #append>
              <q-icon name="search" color="grey-6" />
            </template>
          </q-input>

          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-select
                v-model="selectedStatus"
                outlined
                dense
                label="Status"
                :options="statusOptions"
                emit-value
                map-options
                @update:model-value="onStatusFilterChange"
              />
            </div>
            <div class="col-6">
              <q-select
                v-model="selectedCondition"
                outlined
                dense
                label="Condition"
                :options="conditionOptions"
                emit-value
                map-options
                @update:model-value="onConditionFilterChange"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-pull-to-refresh @refresh="onRefresh" color="primary">
        <PageInitialLoader v-if="loading && stocks.length === 0" />

        <div
          v-else-if="!loading && hasLoadedOnce && stocks.length === 0"
          class="app-empty-state"
        >
          <div class="app-empty-state__icon">
            <q-icon name="inventory_2" size="2rem" />
          </div>
          <div class="text-subtitle1 text-weight-bold text-grey-8"
            >No items found</div
          >
          <q-btn
            color="primary"
            flat
            label="Clear filters"
            no-caps
            class="q-mt-sm"
            @click="clearFilters"
          />
        </div>

        <div v-else class="q-gutter-y-xs">
          <PageInitialLoader v-if="loading" compact />
          <template v-else>
            <q-card
              v-for="item in stocks"
              :key="item.id"
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
                  <q-icon v-else name="image" size="2rem" color="grey-4" />

                  <q-chip
                    dense
                    :color="getStatusColor(item.status)"
                    text-color="white"
                    class="absolute-top-left q-ma-xs text-uppercase text-weight-bold stock-chip"
                  >
                    {{ item.status }}
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
                      <q-icon name="chevron_right" size="18px" color="grey-5" />
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
                      <span v-if="item.size">Sz {{ item.size }}</span>
                    </div>

                    <div
                      class="row items-center bg-grey-1 rounded-borders q-px-sm q-py-xs q-mt-xs"
                      @click.stop="copyBarcode(item.barcode)"
                    >
                      <span
                        class="text-caption text-mono text-grey-8 text-xs truncate col"
                      >
                        {{ item.barcode }}
                      </span>
                      <q-icon name="content_copy" size="12px" color="grey-6" />
                    </div>
                  </div>

                  <div class="row items-end justify-between q-mt-xs">
                    <div class="text-subtitle1 text-weight-bold text-grey-9">
                      {{ formatPrice(item.listed_price, item) }}
                    </div>
                  </div>
                </div>
              </div>
            </q-card>

            <div v-if="meta.total_pages > 1" class="flex flex-center q-py-sm">
              <q-pagination
                v-model="page"
                :max="meta.total_pages"
                :max-pages="5"
                direction-links
                color="primary"
                @update:model-value="onPageChange"
              />
            </div>
          </template>
        </div>
      </q-pull-to-refresh>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAuthStore } from "../stores/authStore";
import { useThriftCurrencyStore } from "../stores/thriftCurrencyStore";
import {
  fetchThriftStocksPaginated,
  type ThriftStockListItem,
  type ThriftStockListMeta
} from "../composables/useThriftStockList";
import { fetchShipmentCostCurrencyMapForIds } from "../composables/useThriftShipment";
import { formatThriftAmount } from "../utils/formatThriftAmount";
import { THRIFT_CONDITION_FILTER_OPTIONS } from "../constants/thriftEnums";
import PageInitialLoader from "../components/PageInitialLoader.vue";
import AppPageHeader from "../components/AppPageHeader.vue";

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const currencyStore = useThriftCurrencyStore();

const stocks = ref<ThriftStockListItem[]>([]);
const loading = ref(true);
const hasLoadedOnce = ref(false);
const searchQuery = ref("");
const selectedStatus = ref<string | null>("AVAILABLE");
const selectedCondition = ref<string | null>(null);
const shipmentCurrencyMap = ref<Map<number, number>>(new Map());

const page = ref(1);
const pageSize = 20;
const filtersReady = ref(false);
let fetchInFlight = false;
let pendingRefetch = false;
let pendingRefetchReset = true;
const meta = ref<ThriftStockListMeta>({
  total: 0,
  page: 1,
  page_size: pageSize,
  total_pages: 0
});

const statusOptions = [
  { label: "All statuses", value: null },
  { label: "Available", value: "AVAILABLE" },
  { label: "Out of stock", value: "OUT_OF_STOCK" },
  { label: "Damaged", value: "DAMAGED" },
  { label: "Stolen", value: "STOLEN" }
];

const conditionOptions = [
  { label: "All conditions", value: null },
  ...THRIFT_CONDITION_FILTER_OPTIONS
];

const currencyForStock = (item: ThriftStockListItem) => {
  const currencyId =
    shipmentCurrencyMap.value.get(item.shipment_id) ??
    authStore.thriftDefaultCostCurrencyId;
  return currencyStore.currencyById(currencyId);
};

const formatPrice = (amount: number, item: ThriftStockListItem) =>
  formatThriftAmount(amount, currencyForStock(item));

const openStock = (id: number) => {
  router.push({ name: "stock-detail", params: { id } });
};

const loadAuxData = async () => {
  const tenantId = authStore.tenantId;
  if (!tenantId) return;

  void currencyStore.loadCurrencies();

  const shipmentIds = stocks.value.map(item => item.shipment_id);
  if (shipmentIds.length === 0) return;

  try {
    const map = await fetchShipmentCostCurrencyMapForIds(tenantId, shipmentIds);
    shipmentCurrencyMap.value = new Map([...shipmentCurrencyMap.value, ...map]);
  } catch (err) {
    console.warn("Failed to load shipment currencies:", err);
  }
};

const loadPage = async () => {
  const tenantId = authStore.tenantId;
  if (!tenantId) {
    loading.value = false;
    return;
  }
  await fetchStocks();
};

const onStatusFilterChange = () => {
  if (!filtersReady.value) return;
  void fetchStocks(true);
};

const onConditionFilterChange = () => {
  if (!filtersReady.value) return;
  void fetchStocks(true);
};

onMounted(async () => {
  await loadPage();
  await nextTick();
  filtersReady.value = true;
});

watch(
  () => authStore.tenantId,
  tenantId => {
    if (tenantId && !hasLoadedOnce.value) void loadPage();
  }
);

const onRefresh = async (done: () => void) => {
  await fetchStocks(true);
  done();
};

const onSearch = () => {
  fetchStocks(true);
};

const onPageChange = () => {
  fetchStocks(false);
};

const clearFilters = () => {
  searchQuery.value = "";
  selectedStatus.value = "AVAILABLE";
  selectedCondition.value = null;
  fetchStocks(true);
};

const fetchStocks = async (reset = true) => {
  const tenantId = authStore.tenantId;
  if (!tenantId) {
    loading.value = false;
    return;
  }

  if (fetchInFlight) {
    pendingRefetch = true;
    pendingRefetchReset = pendingRefetchReset || reset;
    return;
  }

  fetchInFlight = true;
  let currentReset = reset;

  try {
    do {
      pendingRefetch = false;
      const tenantIdForFetch = authStore.tenantId;
      if (!tenantIdForFetch) break;

      loading.value = true;
      if (currentReset) {
        page.value = 1;
        stocks.value = [];
      }

      try {
        const result = await fetchThriftStocksPaginated({
          tenantId: tenantIdForFetch,
          page: page.value,
          pageSize,
          search: searchQuery.value,
          status: selectedStatus.value,
          condition: selectedCondition.value
        });

        stocks.value = result.data;
        meta.value = result.meta;
        void loadAuxData();
      } catch (err: unknown) {
        console.error("Error loading stocks:", err);
        $q.notify({
          type: "negative",
          message:
            err instanceof Error ? err.message : "Failed to retrieve stock list"
        });
      } finally {
        loading.value = false;
        hasLoadedOnce.value = true;
      }

      currentReset = pendingRefetchReset;
      pendingRefetchReset = true;
    } while (pendingRefetch);
  } finally {
    fetchInFlight = false;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "positive";
    case "OUT_OF_STOCK":
      return "grey-6";
    case "DAMAGED":
      return "warning";
    case "STOLEN":
      return "negative";
    default:
      return "primary";
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
  font-size: 8px;
  height: 16px;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
