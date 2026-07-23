import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { supabase } from "../boot/supabase";
import { thriftQueryKeys } from "../queryKeys/thriftQueryKeys";
import {
  fetchShipmentCostCurrencyMapForIds,
  refreshShipmentCurrencyIds
} from "./useThriftShipment";
import type { SelectedShipment } from "../stores/thriftStore";

export function useThriftShipmentsQuery(
  tenantId: Ref<number | null | undefined>
) {
  return useQuery<SelectedShipment[]>({
    queryKey: computed(() =>
      thriftQueryKeys.shipments(tenantId.value ?? 0)
    ),
    queryFn: async () => {
      if (!tenantId.value) return [];
      const { data, error } = await supabase
        .from("thrift_shipments")
        .select("id, name, tenant_id, purchase_currency_id, cost_currency_id")
        .eq("tenant_id", tenantId.value);
      if (error) throw error;
      return (data || []) as SelectedShipment[];
    },
    enabled: computed(() => Boolean(tenantId.value)),
    staleTime: 2 * 60 * 1000
  });
}

export function useThriftShipmentDetailQuery(
  shipmentId: Ref<number | null | undefined>,
  tenantId: Ref<number | null | undefined>
) {
  return useQuery<SelectedShipment | null>({
    queryKey: computed(() =>
      thriftQueryKeys.shipmentDetail(shipmentId.value ?? 0)
    ),
    queryFn: async () => {
      if (!shipmentId.value || !tenantId.value) return null;
      return refreshShipmentCurrencyIds(shipmentId.value, tenantId.value);
    },
    enabled: computed(() => Boolean(shipmentId.value && tenantId.value)),
    staleTime: 2 * 60 * 1000
  });
}

export function useShipmentCostCurrencyMapQuery(
  tenantId: Ref<number | null | undefined>,
  shipmentIds: Ref<number[]>
) {
  return useQuery<Map<number, number>>({
    queryKey: computed(() => [
      "thrift",
      "shipment-cost-currency-map",
      { tenantId: tenantId.value, ids: shipmentIds.value }
    ]),
    queryFn: async () => {
      if (!tenantId.value || !shipmentIds.value.length) return new Map();
      return fetchShipmentCostCurrencyMapForIds(
        tenantId.value,
        shipmentIds.value
      );
    },
    enabled: computed(() => Boolean(tenantId.value && shipmentIds.value.length)),
    staleTime: 2 * 60 * 1000
  });
}
