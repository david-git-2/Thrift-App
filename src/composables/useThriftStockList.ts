import { supabase } from "../boot/supabase";

export interface ThriftStockListMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ThriftStockListItem {
  id: number;
  name: string | null;
  brand_name: string | null;
  color: string | null;
  size: string | null;
  condition: string | null;
  barcode: string | null;
  status: string;
  created_at: string;
  shipment_id: number;
  listed_price: number;
  image_url: string;
}

export interface ThriftStockListResult {
  data: ThriftStockListItem[];
  meta: ThriftStockListMeta;
}

export interface ThriftStockListParams {
  tenantId: number;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string | null;
  condition?: string | null;
}

interface ThriftStockRow {
  id: number;
  name: string | null;
  brand_name: string | null;
  color: string | null;
  size: string | null;
  condition: string | null;
  barcode: string | null;
  status: string;
  created_at: string;
  shipment_id: number;
  thrift_pricings?: Array<{
    listed_unit_price: number;
  }> | null;
  thrift_stock_images?: Array<{
    image_url: string;
    is_primary: boolean;
  }> | null;
}

function shouldFallbackToDirectQuery(error: {
  code?: string;
  message?: string;
  status?: number;
}): boolean {
  const message = error.message ?? "";

  if (
    error.code === "PGRST202" ||
    /could not find the function/i.test(message)
  ) {
    return true;
  }

  if (
    error.code === "57014" ||
    /statement timeout|canceling statement/i.test(message)
  ) {
    return true;
  }

  if (error.status === 502 || error.status === 504) {
    return true;
  }

  return /gateway timeout|bad gateway|504|502/i.test(message);
}

function escapeIlike(value: string): string {
  return value.replace(/[%_(),]/g, " ").trim();
}

function mapStockRow(item: ThriftStockRow): ThriftStockListItem {
  const pricing = item.thrift_pricings?.[0];
  const primaryImage =
    item.thrift_stock_images?.find(img => img.is_primary) ||
    item.thrift_stock_images?.[0];

  return {
    id: item.id,
    name: item.name ?? null,
    brand_name: item.brand_name ?? null,
    color: item.color ?? null,
    size: item.size ?? null,
    condition: item.condition ?? null,
    barcode: item.barcode ?? null,
    status: item.status || "AVAILABLE",
    created_at: item.created_at || "",
    shipment_id: item.shipment_id,
    listed_price: Number(pricing?.listed_unit_price) || 0,
    image_url: primaryImage?.image_url || ""
  };
}

function mapRpcPayload(data: {
  data: Array<Record<string, unknown>>;
  meta: ThriftStockListMeta;
}): ThriftStockListResult {
  const rows = data.data || [];

  return {
    data: rows.map(item => {
      const pricing =
        (item.pricing as Record<string, unknown> | undefined) || {};
      return {
        id: item.id as number,
        name: (item.name as string | null) ?? null,
        brand_name: (item.brand_name as string | null) ?? null,
        color: (item.color as string | null) ?? null,
        size: (item.size as string | null) ?? null,
        condition: (item.condition as string | null) ?? null,
        barcode: (item.barcode as string | null) ?? null,
        status: (item.status as string) || "AVAILABLE",
        created_at: (item.created_at as string) || "",
        shipment_id: Number(item.shipment_id) || 0,
        listed_price: Number(pricing.listed_unit_price) || 0,
        image_url: (item.image_url as string) || ""
      };
    }),
    meta: {
      total: Number(data.meta?.total) || 0,
      page: Number(data.meta?.page) || 1,
      page_size: Number(data.meta?.page_size) || 20,
      total_pages: Number(data.meta?.total_pages) || 0
    }
  };
}

async function fetchThriftStocksViaRpc(
  params: ThriftStockListParams
): Promise<ThriftStockListResult> {
  const { data, error } = await supabase.rpc("list_thrift_stocks_paginated", {
    p_tenant_id: params.tenantId,
    p_page: params.page ?? 1,
    p_page_size: params.pageSize ?? 20,
    p_search: params.search?.trim() || null,
    p_status: params.status || null,
    p_condition: params.condition || null
  });

  if (error) throw error;

  return mapRpcPayload(
    data as {
      data: Array<Record<string, unknown>>;
      meta: ThriftStockListMeta;
    }
  );
}

async function fetchThriftStocksDirect(
  params: ThriftStockListParams
): Promise<ThriftStockListResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = escapeIlike(params.search?.trim() || "");

  let query = supabase
    .from("thrift_stocks")
    .select(
      `
        id,
        name,
        brand_name,
        color,
        size,
        condition,
        section,
        barcode,
        status,
        created_at,
        shipment_id,
        thrift_pricings (
          listed_unit_price
        ),
        thrift_stock_images (
          image_url,
          is_primary
        )
      `,
      { count: "exact" }
    )
    .eq("tenant_id", params.tenantId)
    .order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.condition) {
    query = query.eq("condition", params.condition);
  }

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,brand_name.ilike.%${search}%,barcode.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const total = count ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

  return {
    data: ((data || []) as ThriftStockRow[]).map(mapStockRow),
    meta: {
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages
    }
  };
}

export async function fetchThriftStocksPaginated(
  params: ThriftStockListParams
): Promise<ThriftStockListResult> {
  try {
    return await fetchThriftStocksViaRpc(params);
  } catch (error) {
    if (
      !shouldFallbackToDirectQuery(
        error as { code?: string; message?: string; status?: number }
      )
    ) {
      throw error;
    }

    console.warn(
      "list_thrift_stocks_paginated RPC failed; falling back to direct query.",
      error
    );
    return fetchThriftStocksDirect(params);
  }
}
