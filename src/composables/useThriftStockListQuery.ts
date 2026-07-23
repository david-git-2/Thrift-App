import { useInfiniteQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import {
  fetchThriftStocksPaginated,
  type ThriftStockListParams,
  type ThriftStockListResult
} from "./useThriftStockList";
import { thriftQueryKeys } from "../queryKeys/thriftQueryKeys";

export interface UseThriftStockListQueryOptions {
  tenantId: Ref<number | null>;
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

  const queryKey = computed(() =>
    thriftQueryKeys.stockList({
      tenantId: options.tenantId.value,
      pageSize,
      search: options.search.value,
      status: options.status.value,
      condition: options.condition.value,
      shelfId: options.shelfId?.value ?? null,
      boxId: options.boxId?.value ?? null
    })
  );

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }): Promise<ThriftStockListResult> => {
      const tenantId = options.tenantId.value;
      if (!tenantId) {
        return {
          data: [],
          meta: { total: 0, page: 1, page_size: pageSize, total_pages: 0 }
        };
      }

      const params: ThriftStockListParams = {
        tenantId,
        page: pageParam,
        pageSize,
        search: options.search.value,
        status: options.status.value,
        condition: options.condition.value,
        shelfId: options.shelfId?.value ?? null,
        boxId: options.boxId?.value ?? null
      };

      return fetchThriftStocksPaginated(params);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: ThriftStockListResult) => {
      const { page, total_pages } = lastPage.meta;
      if (total_pages > 0 && page < total_pages) {
        return page + 1;
      }
      return undefined;
    },
    enabled: computed(() => Boolean(options.tenantId.value))
  });
}
