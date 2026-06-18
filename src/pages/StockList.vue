<template>
  <q-page class="bw-page bg-grey-1 theme-app">
    <div class="bw-page__stack">
      <!-- Header Area -->
      <div class="row items-center justify-between q-mb-xs">
        <div>
          <h1 class="text-h5 text-weight-bold text-grey-9 q-my-none">Thrift Stock</h1>
          <p class="text-caption text-grey-6 q-my-none">Browse, search, and manage registered stock items.</p>
        </div>
        <q-btn
          color="primary"
          icon="add"
          label="Add Stock"
          no-caps
          to="/insert-stock"
          class="shadow-1"
        />
      </div>

      <!-- Search and Filter Bar -->
      <q-card class="shadow-1 rounded-borders">
        <q-card-section class="q-pa-sm">
          <div class="row q-col-gutter-sm">
            <!-- Search Input -->
            <div class="col-12 col-sm-6">
              <q-input
                v-model="searchQuery"
                outlined
                dense
                placeholder="Search name, brand, or barcode..."
                debounce="400"
                @update:model-value="onSearch"
              >
                <template v-slot:append>
                  <q-icon name="search" color="grey-6" />
                </template>
              </q-input>
            </div>

            <!-- Status filter -->
            <div class="col-6 col-sm-3">
              <q-select
                v-model="selectedStatus"
                outlined
                dense
                label="Status"
                :options="statusOptions"
                emit-value
                map-options
                clearable
                @update:model-value="fetchStocks(true)"
              />
            </div>

            <!-- Condition filter -->
            <div class="col-6 col-sm-3">
              <q-select
                v-model="selectedCondition"
                outlined
                dense
                label="Condition"
                :options="conditionOptions"
                emit-value
                map-options
                clearable
                @update:model-value="fetchStocks(true)"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Main List Container with Pull to Refresh -->
      <q-pull-to-refresh @refresh="onRefresh" color="primary">
        <div v-if="loading && stocks.length === 0" class="flex flex-center q-py-xl">
          <q-spinner-dots size="40px" color="primary" />
        </div>

        <div v-else-if="stocks.length === 0" class="text-center q-py-xl bg-white rounded-borders shadow-1 border-dashed-grey q-px-md">
          <q-icon name="inventory_2" size="4rem" color="grey-4" class="q-mb-md" />
          <div class="text-h6 text-grey-7 text-weight-medium">No Stock Items Found</div>
          <p class="text-caption text-grey-5 q-mb-md">No items match your filters, or you haven't registered any stock yet.</p>
          <q-btn
            color="primary"
            outline
            label="Clear Filters"
            no-caps
            @click="clearFilters"
          />
        </div>

        <div v-else class="q-gutter-y-sm">
          <!-- Mobile friendly stock cards -->
          <q-card
            v-for="item in stocks"
            :key="item.id"
            class="shadow-1 rounded-borders stock-card overflow-hidden"
          >
            <div class="row no-wrap items-stretch">
              <!-- Item Image Thumbnail -->
              <div class="col-4 flex flex-center bg-grey-2 relative-position">
                <q-img
                  v-if="item.image_url"
                  :src="item.image_url"
                  class="full-height fill-image"
                  ratio="1"
                  fit="cover"
                />
                <q-icon v-else name="image" size="2.5rem" color="grey-4" />
                
                <!-- Status Badge Overlay -->
                <q-chip
                  dense
                  :color="getStatusColor(item.status)"
                  text-color="white"
                  class="absolute-top-left q-ma-xs text-uppercase text-weight-bold"
                  style="font-size: 8px; height: 16px; margin: 4px;"
                >
                  {{ item.status }}
                </q-chip>
              </div>

              <!-- Item Details Content -->
              <div class="col-8 q-pa-sm flex flex-col justify-between">
                <div>
                  <div class="row items-center justify-between no-wrap">
                    <span class="text-caption text-weight-bold text-primary text-uppercase letter-spacing-xs">
                      {{ item.brand_name || 'Generic' }}
                    </span>
                    <q-chip
                      dense
                      outline
                      color="grey-7"
                      class="q-ma-none text-weight-medium text-caption text-uppercase"
                      style="font-size: 9px; height: 16px;"
                    >
                      {{ formatCondition(item.condition) }}
                    </q-chip>
                  </div>

                  <div class="text-subtitle2 text-weight-bold text-grey-9 q-mt-xs ellipsis-2-lines line-height-sm">
                    {{ item.name || item.brand_name || item.barcode }}
                  </div>

                  <!-- Spec properties row -->
                  <div class="row items-center q-gutter-x-sm text-caption text-grey-6 q-mt-xs">
                    <span v-if="item.color" class="row items-center">
                      <q-badge rounded :style="{ backgroundColor: getBadgeColor(item.color) }" class="q-mr-xs border-light" />
                      {{ item.color }}
                    </span>
                    <span v-if="item.color && item.size">•</span>
                    <span v-if="item.size" class="text-weight-medium">Sz {{ item.size }}</span>
                  </div>

                  <!-- Barcode display -->
                  <div class="row items-center justify-between bg-grey-1 rounded-borders q-px-sm q-py-xs q-mt-xs cursor-pointer" @click="copyBarcode(item.barcode)">
                    <span class="text-caption text-mono text-grey-8 font-semibold text-xs truncate">
                      {{ item.barcode }}
                    </span>
                    <q-icon name="content_copy" size="10px" color="grey-6" />
                  </div>
                </div>

                <!-- Bottom Pricing & Actions -->
                <div class="row items-end justify-between q-mt-sm border-top-dashed q-pt-xs">
                  <div>
                    <div class="text-xxs text-grey-5 text-uppercase text-weight-medium">Listed Price</div>
                    <div class="text-subtitle1 text-weight-bold text-grey-9 line-height-none">
                      ${{ item.listed_price?.toFixed(2) || '0.00' }}
                    </div>
                  </div>
                  
                  <div class="text-right">
                    <span class="text-xxs text-grey-5 block">Cost: ${{ item.cost_of_goods_sold?.toFixed(2) || '0.00' }}</span>
                    <span class="text-xxs text-grey-5 block">Target: ${{ item.target_price?.toFixed(2) || '0.00' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </q-card>

          <!-- Pagination -->
          <div v-if="meta.total_pages > 1" class="flex flex-center q-py-md">
            <q-pagination
              v-model="page"
              :max="meta.total_pages"
              :max-pages="6"
              direction-links
              boundary-links
              color="primary"
              @update:model-value="onPageChange"
            />
          </div>

          <div v-if="meta.total > 0" class="text-center text-caption text-grey-6 q-pb-md">
            Page {{ meta.page }} of {{ meta.total_pages }} · {{ meta.total }} items
          </div>
        </div>
      </q-pull-to-refresh>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/authStore'
import {
  fetchThriftStocksPaginated,
  type ThriftStockListMeta,
} from '../composables/useThriftStockList'

const $q = useQuasar()
const authStore = useAuthStore()

// State variables
const stocks = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedStatus = ref<string | null>(null)
const selectedCondition = ref<string | null>(null)

// Pagination
const page = ref(1)
const pageSize = 20
const meta = ref<ThriftStockListMeta>({
  total: 0,
  page: 1,
  page_size: pageSize,
  total_pages: 0,
})

// Dropdown options
const statusOptions = [
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
  { label: 'Damaged', value: 'DAMAGED' },
  { label: 'Stolen', value: 'STOLEN' }
]

const conditionOptions = [
  { label: 'New With Tags', value: 'NEW_WITH_TAGS' },
  { label: 'Excellent', value: 'EXCELLENT' },
  { label: 'Good', value: 'GOOD' },
  { label: 'Fair', value: 'FAIR' }
]

onMounted(async () => {
  await fetchStocks()
})

const onRefresh = async (done: () => void) => {
  await fetchStocks(true)
  done()
}

const onSearch = () => {
  fetchStocks(true)
}

const onPageChange = () => {
  fetchStocks(false)
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = null
  selectedCondition.value = null
  fetchStocks(true)
}

// Fetch helper
const fetchStocks = async (reset = true) => {
  const tenantId = authStore.tenantId
  if (!tenantId) return

  loading.value = true
  if (reset) {
    page.value = 1
    stocks.value = []
  }

  try {
    const result = await fetchThriftStocksPaginated({
      tenantId,
      page: page.value,
      pageSize,
      search: searchQuery.value,
      status: selectedStatus.value,
      condition: selectedCondition.value,
    })

    stocks.value = result.data
    meta.value = result.meta
  } catch (err: unknown) {
    console.error('Error loading stocks:', err)
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to retrieve stock list',
    })
  } finally {
    loading.value = false
  }
}

// UI Helpers
const getStatusColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE': return 'positive'
    case 'OUT_OF_STOCK': return 'grey-6'
    case 'DAMAGED': return 'warning'
    case 'STOLEN': return 'negative'
    default: return 'primary'
  }
}

const formatCondition = (cond: string) => {
  return cond?.replace(/_/g, ' ') || ''
}

const copyBarcode = (barcode: string) => {
  if (!barcode) return
  navigator.clipboard.writeText(barcode)
  $q.notify({
    type: 'positive',
    message: 'Barcode copied to clipboard',
    icon: 'assignment_turned_in',
    timeout: 1000
  })
}

// Convert common color names to CSS colors or fallback
const getBadgeColor = (colorName: string) => {
  const name = colorName?.toLowerCase().trim()
  if (!name) return 'transparent'
  
  const map: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#f59e0b',
    orange: '#f97316',
    purple: '#8b5cf6',
    pink: '#ec4899',
    grey: '#6b7280',
    gray: '#6b7280',
    brown: '#78350f',
    navy: '#1e3a8a'
  }
  
  return map[name] || '#9ca3af'
}
</script>

<style scoped>
.stock-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.stock-card:active {
  transform: scale(0.98);
}

.fill-image {
  object-fit: cover;
}

.border-dashed-grey {
  border: 2px dashed #e2e8f0;
}

.border-top-dashed {
  border-top: 1px dashed rgba(0, 0, 0, 0.08);
}

.border-light {
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.text-xxs {
  font-size: 9px;
  line-height: 11px;
}

.line-height-none {
  line-height: 1;
}

.line-height-sm {
  line-height: 1.2;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.letter-spacing-xs {
  letter-spacing: 0.05em;
}
</style>
