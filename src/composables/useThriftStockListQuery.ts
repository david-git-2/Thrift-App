import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import {
  fetchThriftStocksPaginated,
  type ThriftStockListParams,
  type ThriftStockListResult
} from "./useThriftStockList";
import { thriftQueryKeys } from "../queryKeys/thriftQueryKeys";

export interface UseThriftStockListQueryOptions {
  tenantId: Ref<number | null>;
  page: Ref<number>;
  pageSize?: number;
  search: Ref<string>;
  status: Ref<string | null>;
  condition: Ref<string | null>;
  shelfId?: Ref<number | null>;
  boxId?: Ref<number | null>;
}

export function useThriftStockListQuery(
  options: UseThriftStockListQueryOptions
) {
  const pageSize = options.pageSize ?? 20;

  const queryParams = computed<ThriftStockListParams | null>(() => {
    if (!options.tenantId.value) return null;
    return {
      tenantId: options.tenantId.value,
      page: options.page.value,
      pageSize,
      search: options.search.value,
      status: options.status.value,
      condition: options.condition.value,
      shelfId: options.shelfId?.value ?? null,
      boxId: options.boxId?.value ?? null
    };
  });

  const queryKey = computed(() =>
    thriftQueryKeys.stockList({
      tenantId: options.tenantId.value,
      page: options.page.value,
      pageSize,
      search: options.search.value,
      status: options.status.value,
      condition: options.condition.value,
      shelfId: options.shelfId?.value ?? null,
      boxId: options.boxId?.value ?? null
    })
  );

  return useQuery<ThriftStockListResult>({
    queryKey,
    queryFn: async () => {
      if (!queryParams.value) {
        return {
          data: [],
          meta: { total: 0, page: 1, page_size: pageSize, total_pages: 0 }
        };
      }
      return fetchThriftStocksPaginated(queryParams.value);
    },
    enabled: computed(() => Boolean(options.tenantId.value))
  });
}
