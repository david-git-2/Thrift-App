import { useThriftCurrencyStore } from '../stores/thriftCurrencyStore'

/** Active row from `global_currencies` (same source as wholesale thriftCurrencyRepository). */
export interface ThriftCurrency {
  id: number
  name: string
  code: string
  symbol: string
}

export async function fetchThriftCurrencies(): Promise<ThriftCurrency[]> {
  return useThriftCurrencyStore().loadCurrencies()
}

export function currencyById(id: number | null | undefined): ThriftCurrency | undefined {
  return useThriftCurrencyStore().currencyById(id)
}
