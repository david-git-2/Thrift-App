<template>
  <q-page class="dashboard-page q-pa-md bg-grey-1">
    <div class="dashboard-container">
      <!-- Header Banner -->
      <div class="dashboard-header q-mb-md">
        <div class="row items-center justify-between">
          <div>
            <div class="text-h6 text-weight-bold text-dark">
              {{ $t("dashboard.title") }}
            </div>
            <div class="text-caption text-grey-7">
              {{ formattedDate }} • {{ tenantName }}
            </div>
          </div>
          <div class="row items-center q-gutter-x-xs">
            <q-btn
              flat
              round
              dense
              icon="ph-regular ph-question"
              color="grey-7"
              @click="showHelpDialog = true"
            >
              <q-tooltip>{{ $t("common.help", "Help") }}</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="ph-regular ph-arrows-clockwise"
              color="primary"
              :loading="isFetching"
              @click="() => refetch()"
            >
              <q-tooltip>{{ $t("common.refresh") }}</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>

      <!-- Action Tiles -->
      <div class="action-tiles q-mb-lg">
        <div class="text-subtitle2 text-weight-bold text-grey-8 q-mb-sm">
          {{ $t("dashboard.quickActions") }}
        </div>
        <div class="row q-col-gutter-md">
          <!-- Insert New -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              class="action-tile action-tile--insert cursor-pointer"
              v-ripple
              @click="router.push('/insert-stock')"
            >
              <q-card-section class="row items-center no-wrap">
                <div
                  class="action-tile__icon-wrap action-tile__icon-wrap--primary"
                >
                  <q-icon name="ph-regular ph-plus-circle" size="32px" />
                </div>
                <div class="q-ml-md">
                  <div class="text-subtitle1 text-weight-bold text-dark">
                    {{ $t("dashboard.insertNewTile") }}
                  </div>
                  <div class="text-caption text-grey-7">
                    {{ $t("dashboard.insertNewSubtitle") }}
                  </div>
                </div>
                <q-space />
                <q-icon name="ph-regular ph-caret-right" size="24px" class="text-grey-5" />
              </q-card-section>
            </q-card>
          </div>

          <!-- Scan & Action -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              class="action-tile action-tile--scan cursor-pointer"
              v-ripple
              @click="router.push('/scan-barcode')"
            >
              <q-card-section class="row items-center no-wrap">
                <div
                  class="action-tile__icon-wrap action-tile__icon-wrap--accent"
                >
                  <q-icon name="ph-regular ph-qr-code" size="32px" />
                </div>
                <div class="q-ml-md">
                  <div class="text-subtitle1 text-weight-bold text-dark">
                    {{ $t("dashboard.scanActionTile") }}
                  </div>
                  <div class="text-caption text-grey-7">
                    {{ $t("dashboard.scanActionSubtitle") }}
                  </div>
                </div>
                <q-space />
                <q-icon name="ph-regular ph-caret-right" size="24px" class="text-grey-5" />
              </q-card-section>
            </q-card>
          </div>

          <!-- View Inventory -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              class="action-tile action-tile--inventory cursor-pointer"
              v-ripple
              @click="router.push('/stock-list')"
            >
              <q-card-section class="row items-center no-wrap">
                <div
                  class="action-tile__icon-wrap action-tile__icon-wrap--positive"
                >
                  <q-icon name="ph-regular ph-package" size="32px" />
                </div>
                <div class="q-ml-md">
                  <div class="text-subtitle1 text-weight-bold text-dark">
                    {{ $t("dashboard.viewInventoryTile") }}
                  </div>
                  <div class="text-caption text-grey-7">
                    {{ $t("dashboard.viewInventorySubtitle") }}
                  </div>
                </div>
                <q-space />
                <q-icon name="ph-regular ph-caret-right" size="24px" class="text-grey-5" />
              </q-card-section>
            </q-card>
          </div>

          <!-- Stocktake Audit -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              class="action-tile action-tile--audit cursor-pointer"
              v-ripple
              @click="router.push('/audit-mode')"
            >
              <q-card-section class="row items-center no-wrap">
                <div
                  class="action-tile__icon-wrap action-tile__icon-wrap--warning"
                >
                  <q-icon name="ph-regular ph-clipboard-text" size="32px" />
                </div>
                <div class="q-ml-md">
                  <div class="text-subtitle1 text-weight-bold text-dark">
                    {{ $t("dashboard.auditModeTile") }}
                  </div>
                  <div class="text-caption text-grey-7">
                    {{ $t("dashboard.auditModeSubtitle") }}
                  </div>
                </div>
                <q-space />
                <q-icon name="ph-regular ph-caret-right" size="24px" class="text-grey-5" />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Metrics Section -->
      <div class="metrics-section">
        <div class="text-subtitle2 text-weight-bold text-grey-8 q-mb-sm">
          {{ $t("dashboard.subtitle") }}
        </div>

        <div v-if="isLoading" class="row q-col-gutter-md">
          <div v-for="n in 3" :key="n" class="col-12 col-sm-4">
            <q-card flat bordered class="q-pa-md app-card">
              <div class="row items-center justify-between q-mb-xs">
                <q-skeleton type="text" width="45%" animation="wave" />
                <q-skeleton type="QAvatar" size="36px" animation="wave" />
              </div>
              <q-skeleton type="text" width="60%" height="36px" animation="wave" />
            </q-card>
          </div>
        </div>

        <div
          v-else-if="isError"
          class="q-pa-md bg-negative-1 text-negative rounded-borders"
        >
          <div class="row items-center">
            <q-icon name="error" size="24px" class="q-mr-sm" />
            <div>{{ $t("common.error") }}</div>
            <q-btn
              flat
              dense
              :label="$t('common.refresh')"
              class="q-ml-auto"
              @click="() => refetch()"
            />
          </div>
        </div>

        <div v-else class="row q-col-gutter-md">
          <!-- Items Added Today -->
          <div class="col-12 col-sm-4">
            <q-card flat bordered class="metric-card metric-card--blue">
              <q-card-section>
                <div class="row items-center justify-between">
                  <div class="text-caption text-weight-medium text-grey-7">
                    {{ $t("dashboard.itemsAddedToday") }}
                  </div>
                  <q-avatar size="36px" color="blue-1" text-color="blue-9">
                    <q-icon name="ph-regular ph-calendar" size="20px" />
                  </q-avatar>
                </div>
                <div class="text-h4 text-weight-bolder text-blue-10 q-mt-xs">
                  {{ metrics?.itemsAddedToday ?? 0 }}
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Available Stock -->
          <div class="col-12 col-sm-4">
            <q-card flat bordered class="metric-card metric-card--green">
              <q-card-section>
                <div class="row items-center justify-between">
                  <div class="text-caption text-weight-medium text-grey-7">
                    {{ $t("dashboard.availableStock") }}
                  </div>
                  <q-avatar size="36px" color="green-1" text-color="green-9">
                    <q-icon name="ph-regular ph-check-circle" size="20px" />
                  </q-avatar>
                </div>
                <div class="text-h4 text-weight-bolder text-green-10 q-mt-xs">
                  {{ metrics?.availableItems ?? 0 }}
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Total Inventory -->
          <div class="col-12 col-sm-4">
            <q-card flat bordered class="metric-card metric-card--purple">
              <q-card-section>
                <div class="row items-center justify-between">
                  <div class="text-caption text-weight-medium text-grey-7">
                    {{ $t("dashboard.totalInventory") }}
                  </div>
                  <q-avatar
                    size="36px"
                    color="deep-purple-1"
                    text-color="deep-purple-9"
                  >
                    <q-icon name="ph-regular ph-warehouse" size="20px" />
                  </q-avatar>
                </div>
                <div
                  class="text-h4 text-weight-bolder text-deep-purple-10 q-mt-xs"
                >
                  {{ metrics?.totalItems ?? 0 }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard Help Dialog -->
    <AppHelpDialog
      v-model="showHelpDialog"
      :title="$t('help.dashboard.title')"
      :subtitle="$t('help.dashboard.subtitle')"
      icon="ph-regular ph-squares-four"
      :steps="helpSteps"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../stores/authStore";
import { useThriftDashboardMetricsQuery } from "../composables/useThriftDashboardMetricsQuery";
import AppHelpDialog, { type HelpStep } from "../components/AppHelpDialog.vue";

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const showHelpDialog = ref(false);

const helpSteps = computed<HelpStep[]>(() => [
  {
    title: t("help.dashboard.steps.step1Title"),
    description: t("help.dashboard.steps.step1Desc"),
    tip: t("help.dashboard.steps.step1Tip"),
  },
  {
    title: t("help.dashboard.steps.step2Title"),
    description: t("help.dashboard.steps.step2Desc"),
  },
  {
    title: t("help.dashboard.steps.step3Title"),
    description: t("help.dashboard.steps.step3Desc"),
  },
  {
    title: t("help.dashboard.steps.step4Title"),
    description: t("help.dashboard.steps.step4Desc"),
  },
]);

const tenantId = computed(() => authStore.tenantId);
const tenantName = computed(
  () =>
    authStore.selectedTenant?.name ?? authStore.tenant?.name ?? "Thrift Store"
);

const formattedDate = computed(() => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date());
});

const {
  data: metrics,
  isLoading,
  isError,
  isFetching,
  refetch
} = useThriftDashboardMetricsQuery(tenantId);
</script>

<style scoped>
.dashboard-page {
  max-width: 1000px;
  margin: 0 auto;
}

.action-tile {
  border-radius: 12px;
  background: var(--bw-glass-bg, rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(12px);
  border: 1px solid var(--bw-glass-border, rgba(255, 255, 255, 0.3));
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
  min-height: 84px;
}

.action-tile:active {
  transform: scale(0.98);
}

.action-tile__icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-tile__icon-wrap--primary {
  background-color: #e3f2fd;
  color: #1976d2;
}

.action-tile__icon-wrap--accent {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.action-tile__icon-wrap--positive {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.action-tile__icon-wrap--warning {
  background-color: #fff8e1;
  color: #f57f17;
}

.metric-card {
  border-radius: 12px;
  background: var(--bw-glass-bg, rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(12px);
  border: 1px solid var(--bw-glass-border, rgba(255, 255, 255, 0.3));
}

.metric-card--blue {
  border-left: 4px solid #1976d2;
}

.metric-card--green {
  border-left: 4px solid #2e7d32;
}

.metric-card--purple {
  border-left: 4px solid #7b1fa2;
}
</style>
