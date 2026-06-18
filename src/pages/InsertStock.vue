<template>
  <q-page class="bw-page bg-grey-1 flex flex-center theme-app">
    <div class="text-center full-width q-px-md" style="max-width: 500px;">
      <!-- State 1: No shipment selected -->
      <div v-if="!selectedShipment">
        <div class="q-mb-xl">
          <q-icon name="storefront" size="80px" color="primary" class="q-mb-md opacity-80" />
          <h1 class="text-h4 text-weight-bold text-grey-9 q-my-none">Thrift Stock Manager</h1>
          <p class="text-subtitle1 text-grey-6 q-mt-sm">Select shipment & box to start registering stock items.</p>
        </div>

        <q-btn
          color="primary"
          class="q-px-xl q-py-md text-weight-bold large-store-btn shadow-2"
          size="lg"
          icon="store"
          label="Add Store"
          no-caps
          @click="openSelector"
        />
      </div>

      <!-- State 2: Shipment & Box are active -->
      <div v-else class="q-gutter-y-md">
        <q-card class="dialog-card shadow-3 q-pa-lg text-left">
          <q-card-section class="q-pa-none">
            <div class="row items-center justify-between q-mb-md">
              <span class="text-subtitle2 text-weight-bold text-primary text-uppercase tracking-wider">Active Workspace</span>
              <q-chip icon="check_circle" color="positive" text-color="white" size="sm" dense class="q-px-sm">Ready</q-chip>
            </div>
            
            <div class="q-mb-md">
              <label class="text-caption text-weight-medium text-grey-6 uppercase block">Shipment</label>
              <div class="text-h6 text-weight-bold text-grey-9">{{ selectedShipment.name }}</div>
            </div>

            <div class="q-mb-lg">
              <label class="text-caption text-weight-medium text-grey-6 uppercase block">Active Box</label>
              <div class="text-h6 text-weight-bold text-grey-9">
                {{ selectedBox ? selectedBox.name : 'No specific box selected' }}
              </div>
            </div>
          </q-card-section>

          <q-separator class="q-my-md" />

          <q-card-actions class="q-pa-none column q-gutter-y-sm">
            <q-btn
              color="primary"
              class="full-width text-weight-bold q-py-sm"
              icon="photo_camera"
              label="Start Registration"
              no-caps
              size="md"
              @click="goToRegistration"
            />
            <q-btn
              flat
              color="grey-7"
              class="full-width text-weight-medium"
              icon="swap_horiz"
              label="Change Shipment / Box"
              no-caps
              @click="openSelector"
            />
          </q-card-actions>
        </q-card>
      </div>

      <!-- Selector Dialog -->
      <q-dialog v-model="dialogOpen" persistent>
        <q-card class="dialog-card">
          <q-card-section class="row items-center justify-between q-pb-md">
            <div class="text-h6 text-weight-bold">Select Shipment & Box</div>
            <q-btn flat round dense icon="close" v-close-popup />
          </q-card-section>

          <q-card-section class="q-pt-none q-gutter-md text-left">
            <!-- Shipment Select -->
            <div>
              <label class="text-subtitle2 text-weight-bold text-grey-8 block q-mb-xs">Shipment</label>
              <q-select
                v-model="tempShipment"
                :options="shipmentOptions"
                option-label="name"
                option-value="id"
                outlined
                dense
                label="Select Shipment"
                :loading="loadingShipments"
                @update:model-value="onShipmentChange"
              />
            </div>

            <!-- Box Select -->
            <div>
              <label class="text-subtitle2 text-weight-bold text-grey-8 block q-mb-xs">Box</label>
              <q-select
                v-model="tempBox"
                :options="boxOptions"
                option-label="name"
                outlined
                dense
                clearable
                label="Select Box (optional)"
                :loading="loadingBoxes"
                :disable="!tempShipment"
              />
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                icon="add_box"
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
              label="Confirm"
              color="primary"
              no-caps
              :disable="!tempShipment"
              @click="onConfirm"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Create Box Dialog -->
      <q-dialog v-model="createBoxDialogOpen" persistent>
        <q-card class="dialog-card">
          <q-card-section class="row items-center justify-between q-pb-sm">
            <div class="text-h6 text-weight-bold">New Box</div>
            <q-btn flat round dense icon="close" v-close-popup />
          </q-card-section>

          <q-card-section class="q-pt-none q-gutter-md text-left">
            <div v-if="tempShipment" class="text-caption text-grey-6">
              Shipment: <span class="text-weight-bold text-grey-8">{{ tempShipment.name }}</span>
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
              label="Create Box"
              color="primary"
              no-caps
              :loading="creatingBox"
              :disable="!newBoxForm.name.trim()"
              @click="saveNewBox"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useThriftStore } from '../stores/thriftStore'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../boot/supabase'

const router = useRouter()
const $q = useQuasar()
const thriftStore = useThriftStore()
const authStore = useAuthStore()

// State
const dialogOpen = ref(false)
const createBoxDialogOpen = ref(false)
const loadingShipments = ref(false)
const loadingBoxes = ref(false)
const creatingBox = ref(false)

const shipmentOptions = ref<any[]>([])
const boxOptions = ref<any[]>([])

const tempShipment = ref<any>(null)
const tempBox = ref<any>(null)

const newBoxForm = ref({
  name: '',
  weight: null as number | null,
  received_weight: null as number | null,
})

// Computed
const selectedShipment = computed(() => thriftStore.selectedShipment)
const selectedBox = computed(() => thriftStore.selectedBox)
const tenantId = computed(() => authStore.tenantId)

// Methods
const openSelector = async () => {
  tempShipment.value = selectedShipment.value
  tempBox.value = selectedBox.value
  dialogOpen.value = true
  await fetchShipments()
  if (tempShipment.value) {
    await fetchBoxes(tempShipment.value.id)
  }
}

const fetchShipments = async () => {
  if (!tenantId.value) return
  loadingShipments.value = true
  try {
    const { data, error } = await supabase
      .from('thrift_shipments')
      .select('id, name, tenant_id')
      .eq('tenant_id', tenantId.value)
      .order('created_at', { ascending: false })

    if (error) throw error
    shipmentOptions.value = data || []
  } catch (err) {
    console.error('Error fetching shipments:', err)
  } finally {
    loadingShipments.value = false
  }
}

const fetchBoxes = async (shipmentId: number) => {
  if (!tenantId.value) return
  loadingBoxes.value = true
  try {
    const { data, error } = await supabase
      .from('thrift_boxes')
      .select('id, name, shipment_id, tenant_id')
      .eq('shipment_id', shipmentId)
      .eq('tenant_id', tenantId.value)
      .order('name', { ascending: true })

    if (error) throw error
    boxOptions.value = data || []
  } catch (err) {
    console.error('Error fetching boxes:', err)
  } finally {
    loadingBoxes.value = false
  }
}

const onShipmentChange = async (shipment: any) => {
  tempBox.value = null
  boxOptions.value = []
  if (shipment) {
    await fetchBoxes(shipment.id)
  }
}

const openCreateBoxDialog = () => {
  if (!tempShipment.value) return
  newBoxForm.value = {
    name: '',
    weight: null,
    received_weight: null,
  }
  createBoxDialogOpen.value = true
}

const saveNewBox = async () => {
  const name = newBoxForm.value.name.trim()
  if (!name || !tempShipment.value || !tenantId.value) return

  creatingBox.value = true
  try {
    const { data, error } = await supabase
      .from('thrift_boxes')
      .insert({
        tenant_id: tenantId.value,
        shipment_id: tempShipment.value.id,
        name,
        weight: newBoxForm.value.weight ?? null,
        received_weight: newBoxForm.value.received_weight ?? null,
        inserted_by: authStore.user?.email || 'app-user',
      })
      .select('id, name, shipment_id, tenant_id')
      .single()

    if (error) throw error

    await fetchBoxes(tempShipment.value.id)
    tempBox.value = data
    createBoxDialogOpen.value = false

    $q.notify({ type: 'positive', message: `Box "${name}" created` })
  } catch (err) {
    console.error('Error creating box:', err)
    const message = err instanceof Error ? err.message : 'Failed to create box'
    $q.notify({ type: 'negative', message })
  } finally {
    creatingBox.value = false
  }
}

const onConfirm = () => {
  thriftStore.setSelection(tempShipment.value, tempBox.value)
  dialogOpen.value = false
  goToRegistration()
}

const goToRegistration = () => {
  router.push('/register-stock')
}
</script>

<style scoped>
.large-store-btn {
  border-radius: 16px !important;
  font-size: 1.25rem;
}
.dialog-card {
  width: 100%;
  max-width: 450px;
  border-radius: 14px;
}
.tracking-wider {
  letter-spacing: 0.08em;
}
.opacity-80 {
  opacity: 0.8;
}
</style>
