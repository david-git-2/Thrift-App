import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { supabase } from "../boot/supabase";
import { thriftQueryKeys } from "../queryKeys/thriftQueryKeys";

export interface CreateShipmentParams {
  tenantId: number;
  name: string;
  purchaseCurrencyId?: number | null;
  costCurrencyId?: number | null;
  insertedBy: string;
}

export async function createThriftShipment(
  params: CreateShipmentParams
): Promise<number> {
  const { data, error } = await supabase
    .from("thrift_shipments")
    .insert({
      tenant_id: params.tenantId,
      name: params.name,
      purchase_currency_id: params.purchaseCurrencyId ?? null,
      cost_currency_id: params.costCurrencyId ?? null,
      inserted_by: params.insertedBy
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export function useCreateShipmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateShipmentParams) => createThriftShipment(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: thriftQueryKeys.shipments(variables.tenantId)
      });
      queryClient.invalidateQueries({
        queryKey: ["thrift", "shipment-cost-currency-map"]
      });
    }
  });
}
