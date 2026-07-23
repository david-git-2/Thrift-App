<template>
  <q-page class="bw-page theme-app q-pb-xl bg-grey-1">
    <div class="bw-page__stack">
      <AppPageHeader
        :title="$t('auditMode.title')"
        show-help
        @help="showInfoDialog = true"
      />

      <!-- Stage 1: Location Selection -->
      <q-card v-if="!auditStarted" class="app-card q-pa-md">
        <div class="text-subtitle1 text-weight-bold text-dark q-mb-xs">
          {{ $t("auditMode.selectLocationPrompt") }}
        </div>
        <div class="text-caption text-grey-7 q-mb-md">
          {{ $t("auditMode.selectLocationPrompt") }}
        </div>

        <div class="q-gutter-y-md">
          <q-select
            v-model="selectedShelfId"
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

          <q-select
            v-model="selectedBoxId"
            outlined
            dense
            :label="$t('stockList.filterByBox')"
            :options="boxOptions"
            emit-value
            map-options
            clearable
            class="min-input-target"
          />

          <q-btn
            color="primary"
            unelevated
            icon="play_arrow"
            :label="$t('auditMode.completeAudit')"
            size="md"
            class="full-width app-cta-btn min-tap-target text-weight-bold"
            no-caps
            :disabled="!selectedShelfId"
            :loading="loadingExpected"
            @click="startAuditSession"
          />
        </div>
      </q-card>

      <!-- Stage 2: Active Audit Dashboard -->
      <div v-else class="q-gutter-y-md">
        <!-- Active Session Header -->
        <q-card flat bordered class="q-pa-md bg-grey-1 border-primary">
          <div class="row items-center justify-between q-mb-xs">
            <div class="text-subtitle1 text-weight-bold text-dark">
              Auditing: <span class="text-primary">{{ locationLabel }}</span>
            </div>
            <q-btn
              flat
              dense
              no-caps
              label="End Audit"
              color="negative"
              icon="cancel"
              @click="confirmEndAudit"
            />
          </div>

          <!-- Progress Bar -->
          <div class="q-my-sm">
            <div
              class="row items-center justify-between text-caption text-grey-8 q-mb-xs"
            >
              <span>Verification Progress</span>
              <span class="text-weight-bold"
                >{{ verifiedCount }} / {{ expectedItems.length }} Verified ({{
                  progressPercent
                }}%)</span
              >
            </div>
            <q-linear-progress
              :value="progressFraction"
              color="positive"
              class="rounded-borders"
              size="10px"
            />
          </div>

          <!-- Summary Stat Badges -->
          <div class="row q-col-gutter-xs q-mt-sm">
            <div class="col-4">
              <div
                class="stat-chip bg-green-1 text-green-9 cursor-pointer"
                :class="{ 'stat-chip--active': activeTab === 'verified' }"
                @click="activeTab = 'verified'"
              >
                <div class="text-caption text-weight-medium">Verified</div>
                <div class="text-h6 text-weight-bolder">{{
                  verifiedCount
                }}</div>
              </div>
            </div>

            <div class="col-4">
              <div
                class="stat-chip bg-red-1 text-red-9 cursor-pointer"
                :class="{ 'stat-chip--active': activeTab === 'missing' }"
                @click="activeTab = 'missing'"
              >
                <div class="text-caption text-weight-medium">Missing</div>
                <div class="text-h6 text-weight-bolder">{{ missingCount }}</div>
              </div>
            </div>

            <div class="col-4">
              <div
                class="stat-chip bg-amber-1 text-amber-10 cursor-pointer"
                :class="{ 'stat-chip--active': activeTab === 'misplaced' }"
                @click="activeTab = 'misplaced'"
              >
                <div class="text-caption text-weight-medium">Misplaced</div>
                <div class="text-h6 text-weight-bolder">{{
                  misplacedItems.length
                }}</div>
              </div>
            </div>
          </div>
        </q-card>

        <!-- Scanner Card -->
        <q-card class="app-card q-pa-md">
          <div class="row items-center q-col-gutter-xs">
            <div class="col">
              <q-input
                v-model="scanInput"
                outlined
                dense
                placeholder="Scan barcode..."
                class="min-input-target"
                @keyup.enter="handleScanBarcode(scanInput)"
              />
            </div>
            <div class="col-auto">
              <q-btn
                color="primary"
                icon="qr_code_scanner"
                class="full-height min-tap-target"
                @click="triggerScanner"
              />
            </div>
          </div>
        </q-card>

        <!-- Misplaced Action Bar -->
        <div
          v-if="misplacedItems.length > 0"
          class="row items-center justify-between bg-amber-2 q-pa-sm rounded-borders"
        >
          <span class="text-caption text-weight-bold text-amber-10">
            {{ misplacedItems.length }} misplaced item(s) detected in this
            location!
          </span>
          <q-btn
            color="amber-9"
            unelevated
            dense
            no-caps
            label="Relocate All Here"
            icon="drive_file_move"
            class="q-px-sm"
            :loading="relocatingAll"
            @click="relocateAllMisplaced"
          />
        </div>

        <!-- Filter Tab Selection -->
        <div class="row items-center justify-between q-px-xs">
          <q-tabs
            v-model="activeTab"
            dense
            active-color="primary"
            indicator-color="primary"
            no-caps
            class="text-grey-7"
          >
            <q-tab name="all" label="All" />
            <q-tab name="verified" label="Verified" />
            <q-tab name="missing" label="Missing" />
            <q-tab name="misplaced" label="Misplaced" />
          </q-tabs>

          <span class="text-caption text-grey-6"
            >{{ filteredDisplayItems.length }} Items</span
          >
        </div>

        <!-- Audit Item List -->
        <div class="q-gutter-y-xs">
          <q-card
            v-for="item in filteredDisplayItems"
            :key="item.id"
            flat
            bordered
            class="q-pa-sm rounded-borders"
          >
            <div class="row items-center no-wrap">
              <q-avatar
                size="44px"
                rounded
                class="bg-grey-2 q-mr-sm flex-shrink-0"
              >
                <SmartImage
                  :src="item.image_url"
                  img-class="fit rounded-borders"
                />
              </q-avatar>

              <div class="col min-width-0">
                <div class="row items-center q-gutter-xs">
                  <span
                    class="text-weight-bold text-subtitle2 text-dark ellipsis col"
                  >
                    {{ item.name || item.brand_name || item.barcode }}
                  </span>
                  <q-chip
                    dense
                    size="sm"
                    :color="getDiscrepancyColor(item.discrepancy)"
                    text-color="white"
                    class="text-weight-bold text-uppercase"
                  >
                    {{ item.discrepancy }}
                  </q-chip>
                </div>

                <div
                  class="row items-center text-caption text-grey-7 q-gutter-x-sm"
                >
                  <span class="text-mono">{{ item.barcode }}</span>
                  <span>·</span>
                  <span
                    >{{ item.shelf_code || "No shelf" }}
                    {{ item.box_name ? `/ ${item.box_name}` : "" }}</span
                  >
                </div>
              </div>

              <!-- Individual Action for Misplaced Items -->
              <div v-if="item.discrepancy === 'MISPLACED'" class="q-ml-xs">
                <q-btn
                  flat
                  dense
                  round
                  icon="drive_file_move"
                  color="amber-9"
                  @click="relocateSingleItem(item)"
                >
                  <q-tooltip>Relocate to Current Audit Location</q-tooltip>
                </q-btn>
              </div>
            </div>
          </q-card>

          <div
            v-if="filteredDisplayItems.length === 0"
            class="text-center q-py-md text-grey-6 text-caption"
          >
            No items in this filter view.
          </div>
        </div>
      </div>

      <!-- Simulator Dialog for Non-Native Browsers -->
      <q-dialog v-model="showSimDialog" persistent>
        <q-card style="min-width: 300px" class="rounded-borders">
          <q-card-section class="q-gutter-y-md">
            <div class="text-subtitle1 text-weight-bold"
              >Enter barcode to verify</div
            >
            <q-input
              v-model="simulatedBarcode"
              outlined
              dense
              placeholder="e.g. BC-1-2-12345"
              autofocus
              class="min-input-target"
              @keyup.enter="confirmSimulatedScan"
            />
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              flat
              label="Cancel"
              color="grey-7"
              no-caps
              v-close-popup
              class="min-tap-target"
            />
            <q-btn
              label="Verify Barcode"
              color="primary"
              no-caps
              class="min-tap-target"
              :disabled="!simulatedBarcode.trim()"
              @click="confirmSimulatedScan"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>

    <!-- Information / Help Dialog -->
    <AppHelpDialog
      v-model="showInfoDialog"
      :title="$t('help.auditMode.title')"
      :subtitle="$t('help.auditMode.subtitle')"
      icon="fact_check"
      :steps="helpSteps"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import { useQuery } from "@tanstack/vue-query";
import { supabase } from "../boot/supabase";
import { useAuthStore } from "../stores/authStore";
import { Capacitor } from "@capacitor/core";
import { useBarcodeScan } from "../composables/useBarcodeScan";
import { normalizeScannedBarcode } from "../utils/normalizeScannedBarcode";
import { buildBarcodeCandidates } from "../utils/barcodeCandidates";
import { fetchThriftStockByBarcode } from "../composables/useThriftStockDetail";
import {
  fetchThriftShelves,
  fetchThriftBoxes
} from "../composables/useThriftCatalog";
import {
  useUpdateStockLocationMutation,
  useBulkUpdateStockLocationMutation
} from "../composables/useThriftStockMutations";
import { thriftQueryKeys } from "../queryKeys/thriftQueryKeys";
import { triggerScanFeedback } from "../utils/scanFeedback";
import AppPageHeader from "../components/AppPageHeader.vue";
import AppHelpDialog, { type HelpStep } from "../components/AppHelpDialog.vue";
import SmartImage from "../components/SmartImage.vue";

export type AuditDiscrepancyStatus = "VERIFIED" | "MISSING" | "MISPLACED";

export interface AuditStockItem {
  id: number;
  barcode: string | null;
  name: string | null;
  brand_name: string | null;
  shelf_id: number | null;
  box_id: number | null;
  shelf_code: string;
  box_name: string;
  image_url: string;
  discrepancy: AuditDiscrepancyStatus;
  scannedAt?: string;
}

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const { t } = useI18n();

const helpSteps = computed<HelpStep[]>(() => [
  {
    title: t("help.auditMode.steps.step1Title"),
    description: t("help.auditMode.steps.step1Desc"),
  },
  {
    title: t("help.auditMode.steps.step2Title"),
    description: t("help.auditMode.steps.step2Desc"),
  },
  {
    title: t("help.auditMode.steps.step3Title"),
    description: t("help.auditMode.steps.step3Desc"),
    tip: t("help.auditMode.steps.step3Tip"),
  },
  {
    title: t("help.auditMode.steps.step4Title"),
    description: t("help.auditMode.steps.step4Desc"),
  },
]);
const { scanBarcode } = useBarcodeScan();

const selectedShelfId = ref<number | null>(null);
const selectedBoxId = ref<number | null>(null);
const auditStarted = ref(false);
const loadingExpected = ref(false);
const relocatingAll = ref(false);

const expectedItems = ref<AuditStockItem[]>([]);
const misplacedItems = ref<AuditStockItem[]>([]);
const scanInput = ref("");
const activeTab = ref<"all" | "verified" | "missing" | "misplaced">("all");

const showInfoDialog = ref(false);
const showSimDialog = ref(false);
const simulatedBarcode = ref("");

const tenantId = computed(() => authStore.tenantId);
const updateLocationMutation = useUpdateStockLocationMutation();
const bulkLocationMutation = useBulkUpdateStockLocationMutation();

const shelvesQuery = useQuery({
  queryKey: computed(() => thriftQueryKeys.shelves(tenantId.value)),
  queryFn: () =>
    tenantId.value ? fetchThriftShelves(tenantId.value) : Promise.resolve([])
});

const boxesQuery = useQuery({
  queryKey: computed(() =>
    thriftQueryKeys.boxes(tenantId.value, selectedShelfId.value)
  ),
  queryFn: () =>
    tenantId.value
      ? fetchThriftBoxes(tenantId.value, selectedShelfId.value)
      : Promise.resolve([]),
  enabled: computed(() => Boolean(tenantId.value && selectedShelfId.value))
});

const shelfOptions = computed(
  () =>
    shelvesQuery.data.value?.map(s => ({ label: s.shelf_code, value: s.id })) ??
    []
);

const boxOptions = computed(
  () =>
    boxesQuery.data.value?.map(b => ({ label: b.box_code, value: b.id })) ?? []
);

const selectedShelfObj = computed(() =>
  shelvesQuery.data.value?.find(s => s.id === selectedShelfId.value)
);

const selectedBoxObj = computed(() =>
  boxesQuery.data.value?.find(b => b.id === selectedBoxId.value)
);

const locationLabel = computed(() => {
  let label = selectedShelfObj.value?.shelf_code || "Shelf";
  if (selectedBoxObj.value) {
    label += ` / Box ${selectedBoxObj.value.box_code}`;
  }
  return label;
});

const verifiedCount = computed(
  () => expectedItems.value.filter(i => i.discrepancy === "VERIFIED").length
);
const missingCount = computed(
  () => expectedItems.value.filter(i => i.discrepancy === "MISSING").length
);

const progressFraction = computed(() => {
  if (expectedItems.value.length === 0) return 0;
  return verifiedCount.value / expectedItems.value.length;
});

const progressPercent = computed(() =>
  Math.round(progressFraction.value * 100)
);

const filteredDisplayItems = computed(() => {
  const combined = [...expectedItems.value, ...misplacedItems.value];
  switch (activeTab.value) {
    case "verified":
      return combined.filter(i => i.discrepancy === "VERIFIED");
    case "missing":
      return combined.filter(i => i.discrepancy === "MISSING");
    case "misplaced":
      return combined.filter(i => i.discrepancy === "MISPLACED");
    default:
      return combined;
  }
});

const onShelfChange = () => {
  selectedBoxId.value = null;
};

const startAuditSession = async () => {
  if (!tenantId.value || !selectedShelfId.value) return;
  loadingExpected.value = true;
  try {
    let query = supabase
      .from("thrift_stocks")
      .select(`
        id,
        barcode,
        name,
        brand_name,
        shelf_id,
        box_id,
        thrift_shelves (shelf_code),
        thrift_boxes (name),
        thrift_stock_images (image_url, is_primary)
      `)
      .eq("tenant_id", tenantId.value)
      .eq("shelf_id", selectedShelfId.value);

    if (selectedBoxId.value) {
      query = query.eq("box_id", selectedBoxId.value);
    }

    const { data, error } = await query;
    if (error) throw error;

    expectedItems.value = (data || []).map((raw: any) => {
      const imgs = Array.isArray(raw.thrift_stock_images)
        ? raw.thrift_stock_images
        : [];
      const primary = imgs.find((i: any) => i.is_primary) || imgs[0];
      const shelf = Array.isArray(raw.thrift_shelves)
        ? raw.thrift_shelves[0]
        : raw.thrift_shelves;
      const box = Array.isArray(raw.thrift_boxes)
        ? raw.thrift_boxes[0]
        : raw.thrift_boxes;

      return {
        id: raw.id,
        barcode: raw.barcode,
        name: raw.name,
        brand_name: raw.brand_name,
        shelf_id: raw.shelf_id,
        box_id: raw.box_id,
        shelf_code: shelf?.shelf_code || "",
        box_name: box?.name || "",
        image_url: primary?.image_url || "",
        discrepancy: "MISSING" as AuditDiscrepancyStatus
      };
    });

    misplacedItems.value = [];
    auditStarted.value = true;
    $q.notify({
      type: "positive",
      message: `Loaded ${expectedItems.value.length} expected items`
    });
  } catch (err) {
    console.error("Failed to load expected items:", err);
    $q.notify({
      type: "negative",
      message: "Failed to load audit location items"
    });
  } finally {
    loadingExpected.value = false;
  }
};

const triggerScanner = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const barcodeVal = await scanBarcode();
      if (barcodeVal) {
        await handleScanBarcode(barcodeVal);
      }
    } catch (err) {
      console.error("Audit barcode scanning error:", err);
      triggerScanFeedback("error");
    }
  } else {
    simulatedBarcode.value = "";
    showSimDialog.value = true;
  }
};

const confirmSimulatedScan = () => {
  showSimDialog.value = false;
  if (simulatedBarcode.value.trim()) {
    void handleScanBarcode(simulatedBarcode.value.trim());
  }
};

const handleScanBarcode = async (barcodeVal: string) => {
  if (!tenantId.value || !barcodeVal.trim()) return;

  const normalized = normalizeScannedBarcode(barcodeVal);
  if (!normalized) return;

  scanInput.value = "";

  // 1. Check if barcode matches expected items list
  const candidates = [
    normalized,
    ...buildBarcodeCandidates(tenantId.value, normalized)
  ];
  const matchedIndex = expectedItems.value.findIndex(
    item => item.barcode && candidates.includes(item.barcode)
  );

  if (matchedIndex !== -1) {
    const item = expectedItems.value[matchedIndex];
    if (item) {
      item.discrepancy = "VERIFIED";
      item.scannedAt = new Date().toISOString();
      triggerScanFeedback("success");
      $q.notify({
        type: "positive",
        message: `Verified: ${item.name || item.barcode}`,
        timeout: 1000
      });
    }
    return;
  }

  // 2. Check if already in misplaced list
  const alreadyMisplaced = misplacedItems.value.some(
    item => item.barcode && candidates.includes(item.barcode)
  );
  if (alreadyMisplaced) {
    triggerScanFeedback("error");
    $q.notify({
      type: "warning",
      message: "Item already logged as misplaced",
      timeout: 1000
    });
    return;
  }

  // 3. Database lookup for misplaced item
  try {
    const detail = await fetchThriftStockByBarcode(tenantId.value, normalized);
    if (detail) {
      misplacedItems.value.push({
        id: detail.id,
        barcode: detail.barcode,
        name: detail.name,
        brand_name: detail.brand_name,
        shelf_id: detail.shelf_id,
        box_id: detail.box_id,
        shelf_code: detail.shelf_code,
        box_name: detail.box_name,
        image_url: detail.image_url,
        discrepancy: "MISPLACED",
        scannedAt: new Date().toISOString()
      });
      triggerScanFeedback("error");
      $q.notify({
        type: "warning",
        message: `Misplaced Item: ${detail.name || detail.barcode}`,
        timeout: 1500
      });
    } else {
      triggerScanFeedback("error");
      $q.notify({
        type: "negative",
        message: `Barcode not found: ${normalized}`
      });
    }
  } catch (err) {
    console.error("Misplaced lookup error:", err);
    triggerScanFeedback("error");
  }
};

const relocateSingleItem = async (item: AuditStockItem) => {
  if (!selectedShelfId.value) return;
  try {
    await updateLocationMutation.mutateAsync({
      stockId: item.id,
      shelfId: selectedShelfId.value,
      boxId: selectedBoxId.value
    });

    // Remove from misplaced list & move to verified expected list
    misplacedItems.value = misplacedItems.value.filter(i => i.id !== item.id);
    item.discrepancy = "VERIFIED";
    item.shelf_id = selectedShelfId.value;
    item.box_id = selectedBoxId.value;
    item.shelf_code = selectedShelfObj.value?.shelf_code || "";
    item.box_name = selectedBoxObj.value?.box_code || "";

    expectedItems.value.push(item);
    $q.notify({ type: "positive", message: "Item relocated successfully" });
  } catch (err) {
    console.error("Relocate item error:", err);
    $q.notify({ type: "negative", message: "Failed to relocate item" });
  }
};

const relocateAllMisplaced = async () => {
  if (!selectedShelfId.value || !tenantId.value || misplacedItems.value.length === 0) return;
  relocatingAll.value = true;
  try {
    const stockIds = misplacedItems.value.map(item => item.id);
    await bulkLocationMutation.mutateAsync({
      tenantId: tenantId.value,
      stockIds,
      shelfId: selectedShelfId.value,
      boxId: selectedBoxId.value
    });

    const itemsToRelocate = [...misplacedItems.value];
    misplacedItems.value = [];
    for (const item of itemsToRelocate) {
      item.discrepancy = "VERIFIED";
      item.shelf_id = selectedShelfId.value;
      item.box_id = selectedBoxId.value;
      item.shelf_code = selectedShelfObj.value?.shelf_code || "";
      item.box_name = selectedBoxObj.value?.box_code || "";
      expectedItems.value.push(item);
    }
    $q.notify({ type: "positive", message: "All misplaced items relocated" });
  } catch (err) {
    console.error("Relocate all error:", err);
    $q.notify({ type: "negative", message: "Failed to relocate all items" });
  } finally {
    relocatingAll.value = false;
  }
};

const confirmEndAudit = () => {
  $q.dialog({
    title: "End Audit Session?",
    message: `Verification complete: ${verifiedCount.value} Verified, ${missingCount.value} Missing, ${misplacedItems.value.length} Misplaced.`,
    ok: { label: "End Session", color: "negative", flat: false, noCaps: true },
    cancel: {
      label: "Continue Audit",
      color: "grey-7",
      flat: true,
      noCaps: true
    }
  }).onOk(() => {
    auditStarted.value = false;
    expectedItems.value = [];
    misplacedItems.value = [];
  });
};

const getDiscrepancyColor = (status: AuditDiscrepancyStatus) => {
  switch (status) {
    case "VERIFIED":
      return "positive";
    case "MISSING":
      return "negative";
    case "MISPLACED":
      return "amber-9";
  }
};
</script>

<style scoped>
.min-tap-target {
  min-height: 44px;
}

.min-input-target :deep(.q-field__control) {
  min-height: 44px !important;
}

.stat-chip {
  padding: 8px;
  border-radius: 8px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.15s ease;
}

.stat-chip--active {
  border-color: currentColor;
  transform: scale(1.02);
}

.border-primary {
  border: 1px solid rgb(var(--bw-theme-primary-rgb) / 0.2);
}
</style>
