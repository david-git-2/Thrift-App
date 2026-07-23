<template>
  <q-page class="bw-page theme-app bg-grey-1">
    <div class="bw-page__stack">
      <AppPageHeader
        :title="$t('insertStock.title')"
        show-help
        @help="showInsertHelp = true"
      />

      <!-- State 1: No shipment selected -->
      <q-card v-if="!selectedShipment" class="app-card">
        <q-card-section class="text-center q-py-xl">
          <div class="insert-stock__icon-wrap q-mb-md">
            <q-icon name="ph-regular ph-package" size="2.5rem" color="primary" />
          </div>
          <div class="text-h6 text-weight-bold text-grey-9 q-mb-xs"
            >{{ $t("insertStock.title") }}</div
          >
          <p class="text-body2 text-grey-7 q-mb-lg insert-stock__hint">
            {{ $t("insertStock.barcodePlaceholder") }}
          </p>
          <q-btn
            color="primary"
            unelevated
            class="q-px-xl app-cta-btn"
            size="md"
            icon="ph-regular ph-plus"
            :label="$t('nav.insert')"
            no-caps
            @click="openSelector"
          />
        </q-card-section>
      </q-card>

      <!-- State 2: Shipment & box are active -->
      <q-card v-else class="app-card app-card--elevated">
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <div class="app-section-title q-mb-none">
              <q-icon name="ph-regular ph-squares-four" />
              {{ $t("stockDetail.location") }}
            </div>
            <q-chip
              icon="ph-regular ph-check-circle"
              color="positive"
              text-color="white"
              size="sm"
              dense
              class="q-px-sm"
            >
              {{ $t("common.success") }}
            </q-chip>
          </div>

          <div class="q-mb-md">
            <label
              class="text-caption text-weight-medium text-grey-6 uppercase block"
              >Shipment</label
            >
            <div class="text-subtitle1 text-weight-bold text-grey-9">{{
              selectedShipment.name
            }}</div>
          </div>

          <div>
            <label
              class="text-caption text-weight-medium text-grey-6 uppercase block"
              >Box</label
            >
            <div class="text-subtitle1 text-weight-bold text-grey-9">
              {{ selectedBox ? selectedBox.name : "No box selected" }}
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions class="q-pa-md column q-gutter-y-sm">
          <q-btn
            color="primary"
            unelevated
            class="full-width app-cta-btn"
            icon="ph-regular ph-plus"
            label="Add Item"
            no-caps
            size="md"
            @click="goToRegistration"
          />
          <q-btn
            flat
            color="grey-7"
            class="full-width text-weight-medium"
            icon="ph-regular ph-arrows-left-right"
            label="Change shipment / box"
            no-caps
            @click="openSelector"
          />
        </q-card-actions>
      </q-card>

      <!-- Selector Dialog -->
      <q-dialog v-model="dialogOpen" persistent>
        <q-card class="app-dialog-card dialog-card">
          <q-card-section class="row items-center justify-between q-pb-md">
            <div class="text-h6 text-weight-bold">Select shipment & box</div>
            <q-btn flat round dense icon="ph-regular ph-x" v-close-popup />
          </q-card-section>

          <q-card-section class="q-pt-none q-gutter-md text-left">
            <div>
              <label
                class="text-subtitle2 text-weight-bold text-grey-8 block q-mb-xs"
                >Shipment</label
              >
              <q-select
                v-model="tempShipment"
                :options="shipmentOptions"
                option-label="name"
                option-value="id"
                outlined
                dense
                label="Select shipment"
                :loading="loadingShipments"
                @update:model-value="onShipmentChange"
              />
            </div>

            <div>
              <label
                class="text-subtitle2 text-weight-bold text-grey-8 block q-mb-xs"
                >Box</label
              >
              <q-select
                v-model="tempBox"
                :options="boxOptions"
                option-label="name"
                outlined
                dense
                clearable
                label="Select box (optional)"
                :loading="loadingBoxes"
                :disable="!tempShipment"
              />
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                icon="ph-regular ph-plus-square"
                label="Add new box"
                class="q-mt-xs"
                :disable="!tempShipment"
                @click="openCreateBoxDialog"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" color="grey-7" no-caps v-close-popup />
            <q-btn
              label="Add Item"
              color="primary"
              no-caps
              icon="ph-regular ph-plus"
              :disable="!tempShipment"
              @click="onConfirm"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Create Box Dialog -->
      <q-dialog v-model="createBoxDialogOpen" persistent>
        <q-card class="app-dialog-card dialog-card">
          <q-card-section class="row items-center justify-between q-pb-sm">
            <div class="text-h6 text-weight-bold">New box</div>
            <q-btn flat round dense icon="ph-regular ph-x" v-close-popup />
          </q-card-section>

          <q-card-section class="q-pt-none q-gutter-md text-left">
            <div v-if="tempShipment" class="text-caption text-grey-6">
              Shipment:
              <span class="text-weight-bold text-grey-8">{{
                tempShipment.name
              }}</span>
            </div>

            <q-input
              v-model="newBoxForm.name"
              outlined
              dense
              label="Box name *"
              placeholder="e.g. Box A-12"
              autofocus
              @keyup.enter="saveNewBox"
            />

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  v-model.number="newBoxForm.weight"
                  type="number"
                  step="0.001"
                  outlined
                  dense
                  label="Weight (kg)"
                  placeholder="Optional"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model.number="newBoxForm.received_weight"
                  type="number"
                  step="0.001"
                  outlined
                  dense
                  label="Received wt (kg)"
                  placeholder="Optional"
                />
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" color="grey-7" no-caps v-close-popup />
            <q-btn
              label="Create box"
              color="primary"
              no-caps
              :loading="creatingBox"
              :disable="!newBoxForm.name.trim()"
              @click="saveNewBox"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Stock Registration Setup Help Dialog -->
      <AppHelpDialog
        v-model="showInsertHelp"
        :title="$t('help.insertStock.title')"
        :subtitle="$t('help.insertStock.subtitle')"
        icon="ph-regular ph-package"
        :steps="insertHelpSteps"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useThriftStore } from "../stores/thriftStore";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../boot/supabase";
import { refreshShipmentCurrencyIds } from "../composables/useThriftShipment";
import AppPageHeader from "../components/AppPageHeader.vue";
import AppHelpDialog from "../components/AppHelpDialog.vue";

const router = useRouter();
const $q = useQuasar();
const { tm } = useI18n();
const thriftStore = useThriftStore();
const authStore = useAuthStore();

const showInsertHelp = ref(false);

const insertHelpSteps = computed(() => [
  {
    title: tm("help.insertStock.steps.step1Title") as string,
    description: tm("help.insertStock.steps.step1Desc") as string,
    tip: tm("help.insertStock.steps.step1Tip") as string,
  },
  {
    title: tm("help.insertStock.steps.step2Title") as string,
    description: tm("help.insertStock.steps.step2Desc") as string,
  },
  {
    title: tm("help.insertStock.steps.step3Title") as string,
    description: tm("help.insertStock.steps.step3Desc") as string,
  },
]);

const dialogOpen = ref(false);
const createBoxDialogOpen = ref(false);
const loadingShipments = ref(false);
const loadingBoxes = ref(false);
const creatingBox = ref(false);

const shipmentOptions = ref<any[]>([]);
const boxOptions = ref<any[]>([]);

const tempShipment = ref<any>(null);
const tempBox = ref<any>(null);

const newBoxForm = ref({
  name: "",
  weight: null as number | null,
  received_weight: null as number | null
});

const selectedShipment = computed(() => thriftStore.selectedShipment);
const selectedBox = computed(() => thriftStore.selectedBox);
const tenantId = computed(() => authStore.tenantId);

const goToRegistration = () => {
  router.push("/register-stock");
};

const openSelector = async () => {
  thriftStore.clearShipmentBox();
  tempShipment.value = null;
  tempBox.value = null;
  boxOptions.value = [];
  dialogOpen.value = true;
  await fetchShipments();
};

const hydrateShipmentIfNeeded = async () => {
  const shipment = selectedShipment.value;
  if (!shipment || !tenantId.value) return;
  if (
    shipment.purchase_currency_id != null &&
    shipment.cost_currency_id != null
  ) {
    return;
  }
  try {
    const refreshed = await refreshShipmentCurrencyIds(
      shipment.id,
      tenantId.value
    );
    if (refreshed) {
      thriftStore.setSelection(refreshed, selectedBox.value);
    }
  } catch (err) {
    console.warn("Could not refresh shipment currency IDs:", err);
  }
};

onMounted(() => {
  void hydrateShipmentIfNeeded();
});

const fetchShipments = async () => {
  if (!tenantId.value) return;
  loadingShipments.value = true;
  try {
    const { data, error } = await supabase
      .from("thrift_shipments")
      .select("id, name, tenant_id, purchase_currency_id, cost_currency_id")
      .eq("tenant_id", tenantId.value)
      .order("created_at", { ascending: false });

    if (error) throw error;
    shipmentOptions.value = data || [];
  } catch (err) {
    console.error("Error fetching shipments:", err);
  } finally {
    loadingShipments.value = false;
  }
};

const fetchBoxes = async (shipmentId: number) => {
  if (!tenantId.value) return;
  loadingBoxes.value = true;
  try {
    const { data, error } = await supabase
      .from("thrift_boxes")
      .select("id, name, shipment_id, tenant_id")
      .eq("shipment_id", shipmentId)
      .eq("tenant_id", tenantId.value)
      .order("name", { ascending: true });

    if (error) throw error;
    boxOptions.value = data || [];
  } catch (err) {
    console.error("Error fetching boxes:", err);
  } finally {
    loadingBoxes.value = false;
  }
};

const onShipmentChange = async (shipment: any) => {
  tempBox.value = null;
  boxOptions.value = [];
  if (shipment) {
    await fetchBoxes(shipment.id);
  }
};

const openCreateBoxDialog = () => {
  if (!tempShipment.value) return;
  newBoxForm.value = {
    name: "",
    weight: null,
    received_weight: null
  };
  createBoxDialogOpen.value = true;
};

const saveNewBox = async () => {
  const name = newBoxForm.value.name.trim();
  if (!name || !tempShipment.value || !tenantId.value) return;

  creatingBox.value = true;
  try {
    const { data, error } = await supabase
      .from("thrift_boxes")
      .insert({
        tenant_id: tenantId.value,
        shipment_id: tempShipment.value.id,
        name,
        weight: newBoxForm.value.weight ?? null,
        received_weight: newBoxForm.value.received_weight ?? null,
        inserted_by: authStore.user?.email || "app-user"
      })
      .select("id, name, shipment_id, tenant_id")
      .single();

    if (error) throw error;

    await fetchBoxes(tempShipment.value.id);
    tempBox.value = data;
    createBoxDialogOpen.value = false;

    $q.notify({ type: "positive", message: `Box "${name}" created` });
  } catch (err) {
    console.error("Error creating box:", err);
    const message = err instanceof Error ? err.message : "Failed to create box";
    $q.notify({ type: "negative", message });
  } finally {
    creatingBox.value = false;
  }
};

const onConfirm = () => {
  thriftStore.setSelection(tempShipment.value, tempBox.value);
  dialogOpen.value = false;
  goToRegistration();
};
</script>

<style scoped>
.dialog-card {
  width: 100%;
  max-width: 450px;
}

.insert-stock__icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 1rem;
  background: rgb(var(--bw-theme-primary-rgb) / 0.1);
}

.insert-stock__hint {
  max-width: 18rem;
  margin-inline: auto;
}
</style>
