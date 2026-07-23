import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { thriftQueryKeys } from "../queryKeys/thriftQueryKeys";
import {
  fetchThriftStockById,
  fetchThriftStockByBarcode,
  type ThriftStockDetail
} from "./useThriftStockDetail";

export function useThriftStockDetailQuery(
  tenantId: Ref<number | null | undefined>,
  stockId: Ref<number | null | undefined>
) {
  return useQuery<ThriftStockDetail | null>({
    queryKey: computed(() => thriftQueryKeys.stockDetail(stockId.value ?? 0)),
    queryFn: () => {
      if (!tenantId.value || !stockId.value) return Promise.resolve(null);
      return fetchThriftStockById(tenantId.value, stockId.value);
    },
    enabled: computed(
      () =>
        !!tenantId.value &&
        !!stockId.value &&
        Number.isFinite(stockId.value) &&
        stockId.value > 0
    ),
    staleTime: 30_000
  });
}

export function useThriftStockByBarcodeQuery(
  tenantId: Ref<number | null | undefined>,
  barcode: Ref<string | null | undefined>
) {
  return useQuery<ThriftStockDetail | null>({
    queryKey: computed(() =>
      thriftQueryKeys.stockByBarcode(barcode.value?.trim() ?? "")
    ),
    queryFn: () => {
      const b = barcode.value?.trim();
      if (!tenantId.value || !b) return Promise.resolve(null);
      return fetchThriftStockByBarcode(tenantId.value, b);
    },
    enabled: computed(() => !!tenantId.value && !!barcode.value?.trim()),
    staleTime: 30_000
  });
}
