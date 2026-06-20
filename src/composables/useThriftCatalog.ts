import { supabase } from '../boot/supabase'

export interface ThriftCatalogOption {
  id: number
  name: string
}

export interface ThriftShelfOption {
  id: number
  shelf_code: string
}

export async function fetchThriftCategories(tenantId: number): Promise<ThriftCatalogOption[]> {
  const { data, error } = await supabase
    .from('thrift_categories')
    .select('id, name')
    .or(`tenant_id.eq.${tenantId},is_global.eq.true`)
    .order('name')

  if (error) throw error
  return (data || []) as ThriftCatalogOption[]
}

export async function fetchThriftTypes(tenantId: number): Promise<ThriftCatalogOption[]> {
  const { data, error } = await supabase
    .from('thrift_types')
    .select('id, name')
    .or(`tenant_id.eq.${tenantId},is_global.eq.true`)
    .order('name')

  if (error) throw error
  return (data || []) as ThriftCatalogOption[]
}

export async function fetchThriftShelves(tenantId: number): Promise<ThriftShelfOption[]> {
  const { data, error } = await supabase
    .from('thrift_shelves')
    .select('id, shelf_code')
    .eq('tenant_id', tenantId)
    .order('shelf_code')

  if (error) throw error
  return (data || []) as ThriftShelfOption[]
}

export async function fetchThriftDefaultPurchasePriceGbp(
  tenantId: number,
): Promise<number | null> {
  const { data, error } = await supabase
    .from('thrift_settings')
    .select('default_purchase_price_gbp')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (error) throw error
  if (!data?.default_purchase_price_gbp) return null
  return Number(data.default_purchase_price_gbp) || null
}
