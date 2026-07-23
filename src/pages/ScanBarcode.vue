<template>
  <q-page class="bw-page theme-app q-pb-xl bg-grey-1">
    <div class="bw-page__stack">
      <AppPageHeader
        :title="$t('scanBarcode.title')"
        show-help
        @help="showScannerHelp = true"
      />

      <!-- Scan Header & Mode Toggle Card -->
      <q-card class="app-card q-pa-md">
        <div
          class="row items-center justify-between q-mb-md bg-grey-2 q-pa-sm rounded-borders"
        >
          <div class="row items-center q-gutter-xs">
            <q-icon
              :name="isContinuousMode ? 'playlist_add_check' : 'find_in_page'"
              :color="isContinuousMode ? 'positive' : 'grey-7'"
              size="20px"
            />
            <span class="text-subtitle2 text-weight-bold text-grey-9"
              >{{ isContinuousMode ? $t("scanBarcode.continuousScanMode") : $t("scanBarcode.singleScanMode") }}</span
            >
          </div>
          <q-toggle v-model="isContinuousMode" color="positive" dense />
        </div>

        <div class="text-center q-gutter-y-sm">
          <q-btn
            color="primary"
            unelevated
            icon="qr_code_scanner"
            :label="
              isContinuousMode ? $t('scanBarcode.continuousScanMode') : $t('scanBarcode.singleScanMode')
            "
            size="md"
            class="full-width app-cta-btn min-tap-target"
            no-caps
            @click="startScan"
          />

          <div class="row items-center q-my-sm">
            <div
              class="col"
              style="
                height: 1px;
                background: rgb(var(--bw-theme-primary-rgb) / 0.12);
              "
            />
            <div class="col-auto q-px-sm text-caption text-grey-6"
              >{{ $t("insertStock.barcodePlaceholder") }}</div
            >
            <div
              class="col"
              style="
                height: 1px;
                background: rgb(var(--bw-theme-primary-rgb) / 0.12);
              "
            />
          </div>

          <div class="row q-col-gutter-xs">
            <div class="col">
              <q-input
                v-model="manualBarcode"
                outlined
                dense
                :placeholder="$t('insertStock.barcodePlaceholder')"
                class="min-input-target"
                @keyup.enter="lookupBarcode(manualBarcode)"
              />
            </div>
            <div class="col-auto">
              <q-btn
                color="primary"
                icon="search"
                class="full-height min-tap-target"
                @click="lookupBarcode(manualBarcode)"
                :disabled="!manualBarcode.trim()"
              />
            </div>
          </div>
        </div>
      </q-card>

      <PageInitialLoader v-if="searching" compact message="Looking up..." />

      <!-- Single Scan Detail View (when not continuous mode) -->
      <div v-else-if="scannedItem && !isContinuousMode" class="q-mt-sm">
        <q-card class="app-card overflow-hidden">
          <div class="relative-position">
            <div class="scan-hero-image">
              <SmartImage
                :src="scannedItem.image_url"
                :alt="
                  scannedItem.name ||
                  scannedItem.brand_name ||
                  scannedItem.barcode ||
                  'Product image'
                "
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
              <span
                class="text-caption text-weight-bold text-primary text-uppercase"
              >
                {{ scannedItem.brand_name || "Generic" }}
              </span>
              <q-chip dense outline size="sm" class="q-ma-none">
                {{ formatCondition(scannedItem.condition) }}
              </q-chip>
            </div>

            <div class="text-h6 text-weight-bold text-grey-9 line-height-sm">
              {{
                scannedItem.name ||
                scannedItem.brand_name ||
                scannedItem.barcode
              }}
            </div>

            <div
              class="row items-center q-gutter-xs text-caption text-grey-6 q-mt-xs"
            >
              <span v-if="scannedItem.color">{{ scannedItem.color }}</span>
              <span v-if="scannedItem.color && scannedItem.size">·</span>
              <span v-if="scannedItem.size">Sz {{ scannedItem.size }}</span>
            </div>

            <div
              class="row items-center bg-grey-1 rounded-borders q-px-sm q-py-xs q-mt-sm cursor-pointer min-tap-target"
              @click="copyBarcode(scannedItem.barcode)"
            >
              <q-icon
                name="qr_code"
                size="14px"
                color="grey-6"
                class="q-mr-xs"
              />
              <span class="text-caption text-mono text-grey-8 col">{{
                scannedItem.barcode
              }}</span>
              <q-icon name="content_copy" size="12px" color="grey-6" />
            </div>

            <div class="row q-col-gutter-sm q-mt-md">
              <div class="col-12">
                <div class="scan-price-tile">
                  <div class="text-caption text-grey-6">Listed Price</div>
                  <div class="text-subtitle2 text-weight-bold">{{
                    formatPrice(scannedItem.listed_unit_price)
                  }}</div>
                </div>
              </div>
            </div>

            <div class="q-mt-md q-gutter-y-xs text-body2 text-grey-8">
              <div class="row items-center no-wrap">
                <q-icon
                  name="local_shipping"
                  size="16px"
                  color="grey-6"
                  class="q-mr-sm"
                />
                <span class="ellipsis">
                  {{ scannedItem.shipment_name || "Unknown shipment" }}
                  <span v-if="scannedItem.box_name" class="text-grey-6">
                    · {{ scannedItem.box_name }}</span
                  >
                </span>
              </div>
              <div class="row items-center no-wrap">
                <q-icon
                  name="layers"
                  size="16px"
                  color="grey-6"
                  class="q-mr-sm"
                />
                <span>{{ scannedItem.shelf_code || "No shelf" }}</span>
              </div>
              <div
                v-if="scannedItem.product_weight || scannedItem.note"
                class="row items-start no-wrap"
              >
                <q-icon
                  name="scale"
                  size="16px"
                  color="grey-6"
                  class="q-mr-sm q-mt-xs"
                />
                <span>
                  <span v-if="scannedItem.product_weight"
                    >{{ scannedItem.product_weight }}g</span
                  >
                  <span v-if="scannedItem.note" class="text-grey-6">
                    — {{ scannedItem.note }}</span
                  >
                </span>
              </div>
            </div>

            <!-- Quick Actions: Move Location & Change Status -->
            <div class="row q-col-gutter-sm q-mt-md">
              <div class="col-6">
                <q-btn
                  color="primary"
                  unelevated
                  no-caps
                  class="full-width app-cta-btn min-tap-target text-weight-bold"
                  label="Move Location"
                  icon="drive_file_move"
                  @click="openMoveDialog"
                />
              </div>
              <div class="col-6">
                <q-btn
                  color="deep-orange-8"
                  unelevated
                  no-caps
                  class="full-width app-cta-btn min-tap-target text-weight-bold"
                  label="Change Status"
                  icon="published_with_changes"
                  @click="openStatusDialog"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm q-mt-xs">
              <div class="col-6">
                <q-btn
                  outline
                  color="primary"
                  no-caps
                  class="full-width min-tap-target"
                  label="View & Edit"
                  icon="edit"
                  @click="goToStockDetail"
                />
              </div>
              <div class="col-6">
                <q-btn
                  flat
                  color="grey-7"
                  no-caps
                  class="full-width min-tap-target"
                  label="Scan again"
                  icon="refresh"
                  @click="clearResult"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div
        v-else-if="searchedBarcode && !isContinuousMode"
        class="app-empty-state q-mt-md"
      >
        <div
          class="app-empty-state__icon"
          style="background: rgb(245 158 11 / 0.12); color: #d97706"
        >
          <q-icon name="warning" size="2rem" />
        </div>
        <div class="text-subtitle1 text-weight-bold text-grey-8">Not found</div>
        <p class="text-caption text-grey-6 q-mt-xs text-mono">{{
          searchedBarcode
        }}</p>
        <div class="q-mt-md row justify-center q-gutter-sm">
          <q-btn
            color="primary"
            label="Register item"
            no-caps
            class="min-tap-target"
            @click="goToRegisterStock"
          />
          <q-btn
            flat
            color="grey-7"
            label="Try again"
            no-caps
            class="min-tap-target"
            @click="clearResult"
          />
        </div>
      </div>

      <!-- Queue Banner when in Continuous Mode -->
      <div v-else-if="isContinuousMode" class="q-mt-md">
        <q-card flat bordered class="q-pa-md bg-green-1 border-positive">
          <div class="row items-center justify-between">
            <div class="row items-center q-gutter-sm">
              <q-icon name="view_headline" color="positive" size="24px" />
              <div>
                <div class="text-subtitle2 text-weight-bold text-positive">
                  Queue: {{ bulkQueue.length }} Item(s) Scanned
                </div>
                <div class="text-caption text-grey-7">
                  Scan items continuously. Scans build a queue for batch
                  operations.
                </div>
              </div>
            </div>
            <q-btn
              color="positive"
              unelevated
              no-caps
              label="Bulk Actions"
              icon="flash_on"
              :disabled="bulkQueue.length === 0"
              @click="showBulkDialog = true"
            />
          </div>
        </q-card>
      </div>

      <div v-else class="text-center q-py-lg text-grey-5">
        <q-icon
          name="qr_code_scanner"
          size="3rem"
          color="grey-3"
          class="q-mb-sm"
        />
        <div class="text-body2">Scan or enter a barcode</div>
      </div>

      <!-- Floating Bottom Bulk Queue Panel -->
      <div
        v-if="bulkQueue.length > 0"
        class="bulk-queue-bottom-bar bg-dark text-white q-pa-sm shadow-10"
      >
        <div class="row items-center justify-between">
          <div class="row items-center q-gutter-sm">
            <q-badge
              color="positive"
              class="text-weight-bold text-subtitle2 q-pa-xs"
            >
              {{ bulkQueue.length }}
            </q-badge>
            <span class="text-weight-bold text-subtitle2">Items Queued</span>
          </div>

          <div class="row items-center q-gutter-xs">
            <q-btn
              flat
              dense
              round
              icon="delete_outline"
              color="grey-4"
              @click="clearBulkQueue"
            >
              <q-tooltip>Clear Queue</q-tooltip>
            </q-btn>
            <q-btn
              color="positive"
              unelevated
              no-caps
              label="Bulk Actions"
              icon="flash_on"
              class="min-tap-target text-weight-bold"
              @click="showBulkDialog = true"
            />
          </div>
        </div>
      </div>

      <!-- Quick Action Dialog: Move Location -->
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

          <q-card-section class="q-pt-sm q-gutter-y-sm" v-if="scannedItem">
            <div class="text-caption text-grey-7">
              Item:
              <span class="text-weight-bold text-grey-9">{{
                scannedItem.name || scannedItem.barcode
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

      <!-- Quick Action Dialog: Change Status -->
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

          <q-card-section class="q-pt-sm q-gutter-y-sm" v-if="scannedItem">
            <div class="text-caption text-grey-7 q-mb-xs">
              Item:
              <span class="text-weight-bold text-grey-9">{{
                scannedItem.name || scannedItem.barcode
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

      <!-- Bulk Actions Queue Manager Dialog -->
      <q-dialog v-model="showBulkDialog" persistent>
        <q-card
          style="min-width: 340px; max-width: 450px"
          class="q-pa-sm rounded-borders"
        >
          <q-card-section class="row items-center q-pb-none">
            <div class="text-subtitle1 text-weight-bold"
              >Bulk Queue Actions ({{ bulkQueue.length }})</div
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

          <q-card-section class="q-pt-sm q-gutter-y-sm">
            <q-list
              bordered
              separator
              class="rounded-borders max-height-queue overflow-auto"
            >
              <q-item
                v-for="(item, idx) in bulkQueue"
                :key="item.id"
                class="q-py-xs"
              >
                <q-item-section avatar class="q-pr-xs">
                  <q-avatar size="32px" rounded color="grey-3">
                    <SmartImage
                      :src="item.image_url"
                      img-class="fit rounded-borders"
                    />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label
                    class="text-weight-medium text-caption ellipsis"
                  >
                    {{ item.name || item.brand_name || item.barcode }}
                  </q-item-label>
                  <q-item-label caption class="text-mono text-grey-7">
                    {{ item.barcode }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    size="sm"
                    color="grey-6"
                    @click="removeFromBulkQueue(idx)"
                  />
                </q-item-section>
              </q-item>
            </q-list>

            <div class="row q-col-gutter-sm q-pt-sm">
              <div class="col-6">
                <q-btn
                  color="primary"
                  unelevated
                  no-caps
                  class="full-width min-tap-target text-weight-bold"
                  label="Bulk Move Location"
                  icon="drive_file_move"
                  @click="openBulkMove"
                />
              </div>
              <div class="col-6">
                <q-btn
                  color="deep-orange-8"
                  unelevated
                  no-caps
                  class="full-width min-tap-target text-weight-bold"
                  label="Bulk Change Status"
                  icon="published_with_changes"
                  @click="openBulkStatus"
                />
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Clear Queue"
              color="negative"
              no-caps
              @click="clearBulkQueue"
              class="min-tap-target"
            />
            <q-btn
              flat
              label="Done"
              v-close-popup
              no-caps
              class="min-tap-target"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Bulk Move Dialog -->
      <q-dialog v-model="showBulkMoveDialog" persistent>
        <q-card style="min-width: 320px" class="q-pa-sm rounded-borders">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-subtitle1 text-weight-bold"
              >Bulk Move ({{ bulkQueue.length }} items)</div
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

          <q-card-section class="q-pt-sm q-gutter-y-sm">
            <div class="text-caption text-grey-7"
              >Select target destination shelf and optional box:</div
            >
            <q-select
              v-model="bulkShelfId"
              outlined
              dense
              label="Select Target Shelf"
              :options="shelfOptions"
              emit-value
              map-options
              clearable
              class="min-input-target"
              @update:model-value="onBulkShelfChange"
            />
            <q-select
              v-model="bulkBoxId"
              outlined
              dense
              label="Select Target Box"
              :options="bulkBoxOptions"
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
              label="Apply Move All"
              no-caps
              :loading="bulkProcessing"
              class="min-tap-target"
              @click="applyBulkMove"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Bulk Status Dialog -->
      <q-dialog v-model="showBulkStatusDialog" persistent>
        <q-card style="min-width: 300px" class="q-pa-sm rounded-borders">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-subtitle1 text-weight-bold"
              >Bulk Change Status ({{ bulkQueue.length }} items)</div
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

          <q-card-section class="q-pt-sm q-gutter-y-sm">
            <div class="text-caption text-grey-7"
              >Select status to apply to all queued items:</div
            >
            <q-select
              v-model="bulkStatus"
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
              label="Apply Status All"
              no-caps
              :loading="bulkProcessing"
              class="min-tap-target"
              @click="applyBulkStatus"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="showSimDialog" persistent>
        <q-card style="min-width: 300px" class="rounded-borders">
          <q-card-section class="q-gutter-y-md">
            <div class="text-subtitle1 text-weight-bold">Enter barcode</div>
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
              label="Search"
              color="primary"
              no-caps
              class="min-tap-target"
              :disabled="!simulatedBarcode.trim()"
              @click="confirmSimulatedScan"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Barcode Scanner Help Dialog -->
      <AppHelpDialog
        v-model="showScannerHelp"
        :title="$t('help.scanBarcode.title')"
        :subtitle="$t('help.scanBarcode.subtitle')"
        icon="qr_code_scanner"
        :steps="scannerHelpSteps"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useQuery } from "@tanstack/vue-query";
import { supabase } from "../boot/supabase";
import { useAuthStore } from "../stores/authStore";
import { useThriftStore } from "../stores/thriftStore";
import { Capacitor } from "@capacitor/core";
import { useBarcodeScan } from "../composables/useBarcodeScan";
import { normalizeScannedBarcode } from "../utils/normalizeScannedBarcode";
import { buildBarcodeCandidates } from "../utils/barcodeCandidates";
import {
  useThriftCurrenciesQuery,
  useCurrencyById
} from "../composables/useThriftCurrenciesQuery";
import { refreshShipmentCurrencyIds } from "../composables/useThriftShipment";
import { useThriftStockByBarcodeQuery } from "../composables/useThriftStockDetailQuery";
import { fetchThriftStockByBarcode } from "../composables/useThriftStockDetail";
import { useQueryClient } from "@tanstack/vue-query";
import {
  fetchThriftShelves,
  fetchThriftBoxes
} from "../composables/useThriftCatalog";
import {
  useUpdateStockStatusMutation,
  useUpdateStockLocationMutation,
  useBulkUpdateStockStatusMutation,
  useBulkUpdateStockLocationMutation
} from "../composables/useThriftStockMutations";
import { formatThriftAmount } from "../utils/formatThriftAmount";
import { thriftQueryKeys } from "../queryKeys/thriftQueryKeys";
import { triggerScanFeedback } from "../utils/scanFeedback";
import PageInitialLoader from "../components/PageInitialLoader.vue";
import AppPageHeader from "../components/AppPageHeader.vue";
import AppHelpDialog from "../components/AppHelpDialog.vue";
import SmartImage from "../components/SmartImage.vue";

interface ScannedStockItem {
  id: number;
  shipment_id: number;
  shelf_id: number | null;
  box_id: number | null;
  name: string | null;
  brand_name: string | null;
  color: string | null;
  size: string | null;
  condition: string | null;
  barcode: string | null;
  status: string;
  product_weight: number | null;
  extra_weight: number | null;
  note: string | null;
  listed_unit_price: number;
  image_url: string;
  shelf_code: string;
  shelf_name: string;
  shipment_name: string;
  box_name: string;
}

const router = useRouter();
const $q = useQuasar();
const { tm } = useI18n();
const authStore = useAuthStore();
useThriftCurrenciesQuery();
const thriftStore = useThriftStore();
const { scanBarcode } = useBarcodeScan();

const manualBarcode = ref("");
const searching = ref(false);
const scannedItem = ref<ScannedStockItem | null>(null);
const searchedBarcode = ref("");
const shipmentCostCurrencyId = ref<number | null>(null);

const showScannerHelp = ref(false);

const scannerHelpSteps = computed(() => [
  {
    title: tm("help.scanBarcode.steps.step1Title") as string,
    description: tm("help.scanBarcode.steps.step1Desc") as string,
    tip: tm("help.scanBarcode.steps.step1Tip") as string,
  },
  {
    title: tm("help.scanBarcode.steps.step2Title") as string,
    description: tm("help.scanBarcode.steps.step2Desc") as string,
  },
  {
    title: tm("help.scanBarcode.steps.step3Title") as string,
    description: tm("help.scanBarcode.steps.step3Desc") as string,
  },
]);

const isContinuousMode = ref(false);
const bulkQueue = ref<ScannedStockItem[]>([]);
const showBulkDialog = ref(false);
const showBulkMoveDialog = ref(false);
const showBulkStatusDialog = ref(false);
const bulkProcessing = ref(false);

const bulkShelfId = ref<number | null>(null);
const bulkBoxId = ref<number | null>(null);
const bulkStatus = ref<string>("AVAILABLE");

const showSimDialog = ref(false);
const simulatedBarcode = ref("");

// Quick Actions State & Queries
const showMoveDialog = ref(false);
const showStatusDialog = ref(false);

const dialogShelfId = ref<number | null>(null);
const dialogBoxId = ref<number | null>(null);
const dialogStatus = ref<string>("AVAILABLE");

const tenantId = computed(() => authStore.tenantId);

const shelvesQuery = useQuery({
  queryKey: computed(() => thriftQueryKeys.shelves(tenantId.value)),
  queryFn: () =>
    tenantId.value ? fetchThriftShelves(tenantId.value) : Promise.resolve([]),
  enabled: computed(() =>
    Boolean(
      tenantId.value && (showMoveDialog.value || showBulkMoveDialog.value)
    )
  )
});

const dialogBoxesQuery = useQuery({
  queryKey: computed(() =>
    thriftQueryKeys.boxes(tenantId.value, dialogShelfId.value)
  ),
  queryFn: () =>
    tenantId.value
      ? fetchThriftBoxes(tenantId.value, dialogShelfId.value)
      : Promise.resolve([]),
  enabled: computed(() => Boolean(tenantId.value && showMoveDialog.value))
});

const bulkBoxesQuery = useQuery({
  queryKey: computed(() =>
    thriftQueryKeys.boxes(tenantId.value, bulkShelfId.value)
  ),
  queryFn: () =>
    tenantId.value
      ? fetchThriftBoxes(tenantId.value, bulkShelfId.value)
      : Promise.resolve([]),
  enabled: computed(() => Boolean(tenantId.value && showBulkMoveDialog.value))
});

const shelfOptions = computed(() => [
  { label: "None", value: null },
  ...(shelvesQuery.data.value?.map(s => ({
    label: s.shelf_code,
    value: s.id
  })) ?? [])
]);

const dialogBoxOptions = computed(() => [
  { label: "None", value: null },
  ...(dialogBoxesQuery.data.value?.map(b => ({
    label: b.box_code,
    value: b.id
  })) ?? [])
]);

const bulkBoxOptions = computed(() => [
  { label: "None", value: null },
  ...(bulkBoxesQuery.data.value?.map(b => ({
    label: b.box_code,
    value: b.id
  })) ?? [])
]);

const dialogStatusOptions = [
  { label: "Available", value: "AVAILABLE" },
  { label: "Out of stock", value: "OUT_OF_STOCK" },
  { label: "Damaged", value: "DAMAGED" },
  { label: "Stolen", value: "STOLEN" }
];

const updateStatusMutation = useUpdateStockStatusMutation();
const updateLocationMutation = useUpdateStockLocationMutation();

const openMoveDialog = () => {
  if (!scannedItem.value) return;
  dialogShelfId.value = scannedItem.value.shelf_id;
  dialogBoxId.value = scannedItem.value.box_id;
  showMoveDialog.value = true;
};

const openStatusDialog = () => {
  if (!scannedItem.value) return;
  dialogStatus.value = scannedItem.value.status || "AVAILABLE";
  showStatusDialog.value = true;
};

const onDialogShelfChange = () => {
  dialogBoxId.value = null;
};

const onBulkShelfChange = () => {
  bulkBoxId.value = null;
};

const openBulkMove = () => {
  bulkShelfId.value = null;
  bulkBoxId.value = null;
  showBulkMoveDialog.value = true;
};

const openBulkStatus = () => {
  bulkStatus.value = "AVAILABLE";
  showBulkStatusDialog.value = true;
};

const removeFromBulkQueue = (index: number) => {
  bulkQueue.value.splice(index, 1);
};

const clearBulkQueue = () => {
  bulkQueue.value = [];
  showBulkDialog.value = false;
};

const bulkLocationMutation = useBulkUpdateStockLocationMutation();
const bulkStatusMutation = useBulkUpdateStockStatusMutation();

const applyBulkMove = async () => {
  if (bulkQueue.value.length === 0 || !tenantId.value) return;
  bulkProcessing.value = true;
  try {
    const stockIds = bulkQueue.value.map(item => item.id);
    await bulkLocationMutation.mutateAsync({
      tenantId: tenantId.value,
      stockIds,
      shelfId: bulkShelfId.value,
      boxId: bulkBoxId.value
    });
    $q.notify({
      type: "positive",
      message: `Updated location for ${bulkQueue.value.length} items`
    });
    clearBulkQueue();
    showBulkMoveDialog.value = false;
  } catch (err) {
    console.error("Bulk move error:", err);
    $q.notify({ type: "negative", message: "Failed to perform bulk move" });
  } finally {
    bulkProcessing.value = false;
  }
};

const applyBulkStatus = async () => {
  if (bulkQueue.value.length === 0 || !tenantId.value) return;
  bulkProcessing.value = true;
  try {
    const stockIds = bulkQueue.value.map(item => item.id);
    await bulkStatusMutation.mutateAsync({
      tenantId: tenantId.value,
      stockIds,
      status: bulkStatus.value
    });
    $q.notify({
      type: "positive",
      message: `Updated status for ${bulkQueue.value.length} items`
    });
    clearBulkQueue();
    showBulkStatusDialog.value = false;
  } catch (err) {
    console.error("Bulk status error:", err);
    $q.notify({
      type: "negative",
      message: "Failed to perform bulk status update"
    });
  } finally {
    bulkProcessing.value = false;
  }
};

const saveLocation = async () => {
  if (!scannedItem.value) return;
  try {
    await updateLocationMutation.mutateAsync({
      stockId: scannedItem.value.id,
      shelfId: dialogShelfId.value,
      boxId: dialogBoxId.value
    });
    scannedItem.value.shelf_id = dialogShelfId.value;
    scannedItem.value.box_id = dialogBoxId.value;

    const matchedShelf = shelvesQuery.data.value?.find(
      s => s.id === dialogShelfId.value
    );
    scannedItem.value.shelf_code = matchedShelf?.shelf_code || "No shelf";

    const matchedBox = dialogBoxesQuery.data.value?.find(
      b => b.id === dialogBoxId.value
    );
    scannedItem.value.box_name = matchedBox?.box_code || "";

    $q.notify({ type: "positive", message: "Location updated successfully" });
    showMoveDialog.value = false;
  } catch (err) {
    console.error("Failed to update location:", err);
    $q.notify({ type: "negative", message: "Failed to update location" });
  }
};

const saveStatus = async () => {
  if (!scannedItem.value) return;
  try {
    await updateStatusMutation.mutateAsync({
      stockId: scannedItem.value.id,
      status: dialogStatus.value
    });
    scannedItem.value.status = dialogStatus.value;
    $q.notify({ type: "positive", message: "Status updated successfully" });
    showStatusDialog.value = false;
  } catch (err) {
    console.error("Failed to update status:", err);
    $q.notify({ type: "negative", message: "Failed to update status" });
  }
};

const activeCostCurrencyId = computed(
  () => shipmentCostCurrencyId.value ?? authStore.thriftDefaultCostCurrencyId
);
const costCurrency = useCurrencyById(activeCostCurrencyId);

const formatPrice = (amount: number) =>
  formatThriftAmount(amount, costCurrency.value);

const startScan = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const barcodeVal = await scanBarcode();
      if (barcodeVal) {
        await lookupBarcode(barcodeVal);
      }
    } catch (err) {
      console.error("Barcode scanning error:", err);
      const message = err instanceof Error ? err.message : "Scanning error";
      $q.notify({
        type: "warning",
        message: `${message}. Enter barcode manually.`
      });
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
    void lookupBarcode(simulatedBarcode.value.trim());
  }
};

const lookupBarcode = async (barcodeVal: string) => {
  const tenantId = authStore.tenantId;
  if (!tenantId) {
    $q.notify({ type: "negative", message: "Session expired" });
    triggerScanFeedback("error");
    return;
  }

  if (!barcodeVal.trim()) return;

  const normalized = normalizeScannedBarcode(barcodeVal);
  if (!normalized) return;

  searching.value = true;
  if (!isContinuousMode.value) {
    scannedItem.value = null;
  }
  searchedBarcode.value = normalized;
  shipmentCostCurrencyId.value = null;

  try {
    let lookupBarcodeValue = normalized;

    try {
      const { data: resolved, error: resolveError } = await supabase.rpc(
        "resolve_thrift_barcode",
        {
          p_tenant_id: tenantId,
          p_scanned_value: normalized
        }
      );
      if (resolveError) throw resolveError;

      const match = Array.isArray(resolved) ? resolved[0] : null;
      if (match?.barcode_id) {
        lookupBarcodeValue = match.barcode_id;
        searchedBarcode.value = lookupBarcodeValue;
      }
    } catch (resolveErr) {
      console.warn(
        "resolve_thrift_barcode failed, using direct lookup:",
        resolveErr
      );
      for (const candidate of buildBarcodeCandidates(tenantId, normalized)) {
        const { data, error } = await supabase
          .from("thrift_barcodes")
          .select("barcode_id")
          .eq("tenant_id", tenantId)
          .eq("barcode_id", candidate)
          .maybeSingle();
        if (error) throw error;
        if (data?.barcode_id) {
          lookupBarcodeValue = data.barcode_id;
          searchedBarcode.value = lookupBarcodeValue;
          break;
        }
      }
    }

    const queryClient = useQueryClient();
    const detail = await queryClient.fetchQuery({
      queryKey: thriftQueryKeys.stockByBarcode(lookupBarcodeValue),
      queryFn: () => fetchThriftStockByBarcode(tenantId, lookupBarcodeValue),
      staleTime: 30_000
    });

    if (detail) {
      const shipmentRow = await refreshShipmentCurrencyIds(
        detail.shipment_id,
        tenantId
      );
      shipmentCostCurrencyId.value = shipmentRow?.cost_currency_id ?? null;

      const item: ScannedStockItem = {
        id: detail.id,
        shipment_id: detail.shipment_id,
        shelf_id: detail.shelf_id,
        box_id: detail.box_id,
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
        listed_unit_price: detail.listed_unit_price,
        image_url: detail.image_url,
        shelf_code: detail.shelf_code,
        shelf_name: detail.shelf_name,
        shipment_name: detail.shipment_name,
        box_name: detail.box_name
      };

      triggerScanFeedback("success");

      if (isContinuousMode.value) {
        const exists = bulkQueue.value.some(q => q.id === item.id);
        if (exists) {
          $q.notify({
            type: "warning",
            message: "Item already in queue",
            timeout: 1000
          });
        } else {
          bulkQueue.value.push(item);
          $q.notify({
            type: "positive",
            message: `Queued: ${item.name || item.barcode}`,
            timeout: 1200
          });
        }
        manualBarcode.value = "";
      } else {
        scannedItem.value = item;
      }
    } else {
      triggerScanFeedback("error");
      if (!isContinuousMode.value) {
        scannedItem.value = null;
      } else {
        $q.notify({
          type: "negative",
          message: `Barcode not found: ${normalized}`
        });
      }
    }
  } catch (err: unknown) {
    console.error("Lookup barcode error:", err);
    triggerScanFeedback("error");
    const message = err instanceof Error ? err.message : "Lookup failed";
    $q.notify({ type: "negative", message });
  } finally {
    searching.value = false;
  }
};

const clearResult = () => {
  scannedItem.value = null;
  searchedBarcode.value = "";
  manualBarcode.value = "";
  shipmentCostCurrencyId.value = null;
};

const goToRegisterStock = () => {
  if (searchedBarcode.value) {
    thriftStore.setTempBarcode(searchedBarcode.value);
  }
  router.push("/register-stock");
};

const goToStockDetail = () => {
  if (scannedItem.value?.id) {
    router.push({ name: "stock-detail", params: { id: scannedItem.value.id } });
  }
};

const copyBarcode = (barcode: string | null) => {
  if (!barcode) return;
  navigator.clipboard.writeText(barcode);
  $q.notify({ type: "positive", message: "Barcode copied", timeout: 1000 });
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

const formatCondition = (cond: string | null) => cond?.replace(/_/g, " ") || "";
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

.min-tap-target {
  min-height: 44px;
}

.min-input-target :deep(.q-field__control) {
  min-height: 44px !important;
}

.bulk-queue-bottom-bar {
  position: fixed;
  bottom: 56px;
  left: 0;
  right: 0;
  z-index: 1000;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.max-height-queue {
  max-height: 200px;
}

.border-positive {
  border: 1px solid #2e7d32;
}
</style>
