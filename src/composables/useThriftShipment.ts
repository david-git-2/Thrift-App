import { supabase } from "../boot/supabase";
import type { SelectedShipment } from "../stores/thriftStore";

const shipmentCostCurrencyCache = new Map<number, Map<number, number>>();

function getTenantCache(tenantId: number): Map<number, number> {
  let map = shipmentCostCurrencyCache.get(tenantId);
  if (!map) {
    map = new Map();
    shipmentCostCurrencyCache.set(tenantId, map);
  }
  return map;
}

export async function refreshShipmentCurrencyIds(
  shipmentId: number,
  tenantId: number
): Promise<SelectedShipment | null> {
  const { data, error } = await supabase
    .from("thrift_shipments")
    .select("id, name, tenant_id, purchase_currency_id, cost_currency_id")
    .eq("id", shipmentId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const cache = getTenantCache(tenantId);
  if (data.cost_currency_id != null) {
    cache.set(data.id, data.cost_currency_id);
  }

  return data as SelectedShipment;
}

export async function fetchShipmentCostCurrencyMapForIds(
  tenantId: number,
  shipmentIds: number[]
): Promise<Map<number, number>> {
  const cache = getTenantCache(tenantId);
  const uniqueIds = [...new Set(shipmentIds.filter(id => id > 0))];
  const missingIds = uniqueIds.filter(id => !cache.has(id));

  if (missingIds.length > 0) {
    const { data, error } = await supabase
      .from("thrift_shipments")
      .select("id, cost_currency_id")
      .eq("tenant_id", tenantId)
      .in("id", missingIds);

    if (error) throw error;

    for (const row of data || []) {
      if (row.cost_currency_id != null) {
        cache.set(row.id, row.cost_currency_id);
      }
    }
  }

  const result = new Map<number, number>();
  for (const id of uniqueIds) {
    const costId = cache.get(id);
    if (costId != null) {
      result.set(id, costId);
    }
  }
  return result;
}

export async function fetchShipmentCostCurrencyMap(
  tenantId: number
): Promise<Map<number, number>> {
  const { data, error } = await supabase
    .from("thrift_shipments")
    .select("id, cost_currency_id")
    .eq("tenant_id", tenantId);

  if (error) throw error;

  const cache = getTenantCache(tenantId);
  const map = new Map<number, number>();
  for (const row of data || []) {
    if (row.cost_currency_id != null) {
      cache.set(row.id, row.cost_currency_id);
      map.set(row.id, row.cost_currency_id);
    }
  }
  return map;
}
