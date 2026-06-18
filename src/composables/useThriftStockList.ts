import { supabase } from '../boot/supabase'

export interface ThriftStockListMeta {
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ThriftStockListItem {
  id: number
  name: string | null
  brand_name: string | null
  color: string | null
  size: string | null
  condition: string | null
  barcode: string | null
  status: string
  created_at: string
  cost_of_goods_sold: number
  target_price: number
  listed_price: number
  image_url: string
}

export interface ThriftStockListResult {
  data: ThriftStockListItem[]
  meta: ThriftStockListMeta
}

export interface ThriftStockListParams {
  tenantId: number
  page?: number
  pageSize?: number
  search?: string
  status?: string | null
  condition?: string | null
}

export async function fetchThriftStocksPaginated(
  params: ThriftStockListParams,
): Promise<ThriftStockListResult> {
  const { data, error } = await supabase.rpc('list_thrift_stocks_paginated', {
    p_tenant_id: params.tenantId,
    p_page: params.page ?? 1,
    p_page_size: params.pageSize ?? 20,
    p_search: params.search?.trim() || null,
    p_status: params.status || null,
    p_condition: params.condition || null,
  })

  if (error) throw error

  const payload = data as {
    data: Array<Record<string, unknown>>
    meta: ThriftStockListMeta
  }

  const rows = payload.data || []

  return {
    data: rows.map((item) => {
      const pricing = (item.pricing as Record<string, unknown> | undefined) || {}
      return {
        id: item.id as number,
        name: (item.name as string | null) ?? null,
        brand_name: (item.brand_name as string | null) ?? null,
        color: (item.color as string | null) ?? null,
        size: (item.size as string | null) ?? null,
        condition: (item.condition as string | null) ?? null,
        barcode: (item.barcode as string | null) ?? null,
        status: (item.status as string) || 'AVAILABLE',
        created_at: (item.created_at as string) || '',
        cost_of_goods_sold: Number(pricing.cost_of_goods_sold) || 0,
        target_price: Number(pricing.target_price) || 0,
        listed_price: Number(pricing.listed_price) || 0,
        image_url: (item.image_url as string) || '',
      }
    }),
    meta: {
      total: Number(payload.meta?.total) || 0,
      page: Number(payload.meta?.page) || 1,
      page_size: Number(payload.meta?.page_size) || 20,
      total_pages: Number(payload.meta?.total_pages) || 0,
    },
  }
}
