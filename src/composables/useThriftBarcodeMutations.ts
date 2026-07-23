import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { supabase } from "../boot/supabase";
import { thriftQueryKeys } from "../queryKeys/thriftQueryKeys";

export interface CreateBarcodeParams {
  tenantId: number;
  barcodeId: string;
  shipmentId?: number | null;
  boxId?: number | null;
  insertedBy: string;
}

export interface DeleteBarcodeParams {
  tenantId: number;
  barcodeId: string;
}

export async function createThriftBarcode(
  params: CreateBarcodeParams
): Promise<void> {
  const { error } = await supabase.from("thrift_barcodes").insert({
    tenant_id: params.tenantId,
    barcode_id: params.barcodeId,
    shipment_id: params.shipmentId ?? null,
    box_id: params.boxId ?? null,
    inserted_by: params.insertedBy
  });
  if (error) throw error;
}

export async function deleteThriftBarcode(
  params: DeleteBarcodeParams
): Promise<void> {
  const { error } = await supabase
    .from("thrift_barcodes")
    .delete()
    .eq("tenant_id", params.tenantId)
    .eq("barcode_id", params.barcodeId);
  if (error) throw error;
}

export function useCreateBarcodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateBarcodeParams) => createThriftBarcode(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thrift", "barcodes"] });
      queryClient.invalidateQueries({ queryKey: ["thrift", "stock-list"] });
    }
  });
}

export function useDeleteBarcodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: DeleteBarcodeParams) => deleteThriftBarcode(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thrift", "barcodes"] });
      queryClient.invalidateQueries({ queryKey: ["thrift", "stock-list"] });
    }
  });
}
