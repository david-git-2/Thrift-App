import { supabase } from "../boot/supabase";

export interface ThriftCatalogOption {
  id: number;
  name: string;
  icon?: string | null;
}

export interface ThriftShelfOption {
  id: number;
  shelf_code: string;
}

export interface ThriftBoxOption {
  id: number;
  box_code: string;
  shelf_id: number | null;
}

export async function fetchThriftCategories(
  tenantId: number
): Promise<ThriftCatalogOption[]> {
  const { data, error } = await supabase
    .from("thrift_categories")
    .select("id, name")
    .or(`tenant_id.eq.${tenantId},is_global.eq.true`)
    .order("name");

  if (error) throw error;
  return (data || []) as ThriftCatalogOption[];
}

export async function fetchThriftTypes(
  tenantId: number
): Promise<ThriftCatalogOption[]> {
  const { data, error } = await supabase
    .from("thrift_types")
    .select("id, name, icon")
    .or(`tenant_id.eq.${tenantId},is_global.eq.true`)
    .order("name");

  if (error) throw error;
  return (data || []) as ThriftCatalogOption[];
}

export async function fetchThriftShelves(
  tenantId: number
): Promise<ThriftShelfOption[]> {
  const { data, error } = await supabase
    .from("thrift_shelves")
    .select("id, shelf_code")
    .eq("tenant_id", tenantId)
    .order("shelf_code");

  if (error) throw error;
  return (data || []) as ThriftShelfOption[];
}

export async function fetchThriftBoxes(
  tenantId: number,
  shelfId?: number | null
): Promise<ThriftBoxOption[]> {
  let query = supabase
    .from("thrift_boxes")
    .select("id, box_code, shelf_id")
    .eq("tenant_id", tenantId)
    .order("box_code");

  if (shelfId != null) {
    query = query.eq("shelf_id", shelfId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ThriftBoxOption[];
}

export async function fetchThriftDefaultOriginUnitPrice(
  tenantId: number
): Promise<number | null> {
  const { data, error } = await supabase
    .from("thrift_settings")
    .select("default_origin_unit_price")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw error;
  if (data?.default_origin_unit_price == null) return null;
  return Number(data.default_origin_unit_price) || null;
}
