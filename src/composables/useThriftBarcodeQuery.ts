import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import {
  validateBarcodeForRegistration,
  type BarcodeValidationResult
} from "./useThriftBarcode";
import { thriftQueryKeys } from "../queryKeys/thriftQueryKeys";

export function useThriftBarcodeValidationQuery(
  tenantId: Ref<number | null | undefined>,
  barcode: Ref<string | null | undefined>
) {
  return useQuery<BarcodeValidationResult>({
    queryKey: computed(() =>
      thriftQueryKeys.barcodes({
        tenantId: tenantId.value,
        barcode: barcode.value?.trim() ?? ""
      })
    ),
    queryFn: () => {
      const b = barcode.value?.trim();
      if (!tenantId.value || !b) {
        return Promise.resolve({
          ok: false,
          availability: "not_found",
          message: "Barcode is empty"
        });
      }
      return validateBarcodeForRegistration(tenantId.value, b);
    },
    enabled: computed(() => Boolean(tenantId.value && barcode.value?.trim())),
    staleTime: 10_000
  });
}
