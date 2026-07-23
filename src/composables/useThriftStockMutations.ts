import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { supabase } from "../boot/supabase";
import {
  registerThriftStockFromApp,
  type RegisterStockParams
} from "./useThriftStockRegister";
import {
  updateThriftStock,
  type UpdateThriftStockParams
} from "./useThriftStockUpdate";
import { thriftQueryKeys } from "../queryKeys/thriftQueryKeys";

export function useRegisterStockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: RegisterStockParams) =>
      registerThriftStockFromApp(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["thrift", "stock-list"]
      });
    }
  });
}

export function useUpdateStockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateThriftStockParams) =>
      updateThriftStock(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["thrift", "stock-list"]
      });
      queryClient.invalidateQueries({
        queryKey: thriftQueryKeys.stockDetail(variables.stockId)
      });
    }
  });
}

export interface UpdateStockStatusParams {
  stockId: number;
  status: string;
}

export function useUpdateStockStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateStockStatusParams) => {
      const { error } = await supabase
        .from("thrift_stocks")
        .update({ status: params.status })
        .eq("id", params.stockId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["thrift", "stock-list"] });
      queryClient.invalidateQueries({
        queryKey: thriftQueryKeys.stockDetail(variables.stockId)
      });
    }
  });
}

export interface UpdateStockLocationParams {
  stockId: number;
  shelfId: number | null;
  boxId: number | null;
}

export function useUpdateStockLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateStockLocationParams) => {
      const { error } = await supabase
        .from("thrift_stocks")
        .update({
          shelf_id: params.shelfId,
          box_id: params.boxId
        })
        .eq("id", params.stockId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["thrift", "stock-list"] });
      queryClient.invalidateQueries({
        queryKey: thriftQueryKeys.stockDetail(variables.stockId)
      });
    }
  });
}

export interface BulkUpdateStockLocationParams {
  tenantId: number | string;
  stockIds: number[];
  shelfId: number | null;
  boxId: number | null;
}

export function useBulkUpdateStockLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: BulkUpdateStockLocationParams) => {
      const { error } = await supabase.rpc("bulk_update_thrift_stock_locations", {
        p_tenant_id: params.tenantId,
        p_stock_ids: params.stockIds,
        p_shelf_id: params.shelfId,
        p_box_id: params.boxId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thrift", "stock-list"] });
      queryClient.invalidateQueries({ queryKey: ["thrift", "barcode"] });
    }
  });
}

export interface BulkUpdateStockStatusParams {
  tenantId: number | string;
  stockIds: number[];
  status: string;
}

export function useBulkUpdateStockStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: BulkUpdateStockStatusParams) => {
      const { error } = await supabase.rpc("bulk_update_thrift_stock_statuses", {
        p_tenant_id: params.tenantId,
        p_stock_ids: params.stockIds,
        p_status: params.status
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thrift", "stock-list"] });
      queryClient.invalidateQueries({ queryKey: ["thrift", "detail"] });
    }
  });
}


