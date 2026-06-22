import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../boot/supabase'
import type { ThriftCurrency } from '../composables/useThriftCurrency'

export const useThriftCurrencyStore = defineStore('thriftCurrency', () => {
  const currencies = ref<ThriftCurrency[]>([])
  let loadPromise: Promise<ThriftCurrency[]> | null = null

  function currencyById(id: number | null | undefined): ThriftCurrency | undefined {
    if (id == null) return undefined
    return currencies.value.find((c) => c.id === id)
  }

  async function loadCurrencies(): Promise<ThriftCurrency[]> {
    if (currencies.value.length > 0) return currencies.value
    if (loadPromise) return loadPromise

    loadPromise = (async () => {
      const { data, error } = await supabase
        .from('global_currencies')
        .select('id, name, code, symbol')
        .eq('is_active', true)
        .order('code', { ascending: true })

      if (error) throw error

      currencies.value = (data || []) as ThriftCurrency[]
      return currencies.value
    })()

    try {
      return await loadPromise
    } finally {
      loadPromise = null
    }
  }

  function resetCurrencies() {
    currencies.value = []
    loadPromise = null
  }

  return {
    currencies,
    currencyById,
    loadCurrencies,
    resetCurrencies,
  }
})
