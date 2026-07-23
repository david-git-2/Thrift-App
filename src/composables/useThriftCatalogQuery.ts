import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import {
  fetchThriftCategories,
  fetchThriftTypes,
  fetchThriftBoxes,
  fetchThriftShelves
} from "./useThriftCatalog";
import { thriftQueryKeys } from "../queryKeys/thriftQueryKeys";

export function useThriftCategoriesQuery(
  tenantId: Ref<number | null | undefined>
) {
  return useQuery({
    queryKey: computed(() => thriftQueryKeys.categories(tenantId.value ?? 0)),
    queryFn: () => fetchThriftCategories(tenantId.value ?? 0),
    enabled: computed(() => !!tenantId.value),
    staleTime: 10 * 60 * 1000
  });
}

export function useThriftTypesQuery(tenantId: Ref<number | null | undefined>) {
  return useQuery({
    queryKey: computed(() => thriftQueryKeys.types(tenantId.value ?? 0)),
    queryFn: () => fetchThriftTypes(tenantId.value ?? 0),
    enabled: computed(() => !!tenantId.value),
    staleTime: 10 * 60 * 1000
  });
}

export function useThriftBoxesQuery(
  tenantId: Ref<number | null | undefined>,
  shelfId?: Ref<number | null | undefined>
) {
  return useQuery({
    queryKey: computed(() => [
      ...thriftQueryKeys.boxes(tenantId.value ?? 0),
      { shelfId: shelfId?.value }
    ]),
    queryFn: () => fetchThriftBoxes(tenantId.value ?? 0, shelfId?.value),
    enabled: computed(() => !!tenantId.value),
    staleTime: 10 * 60 * 1000
  });
}

export function useThriftShelvesQuery(
  tenantId: Ref<number | null | undefined>
) {
  return useQuery({
    queryKey: computed(() => thriftQueryKeys.shelves(tenantId.value ?? 0)),
    queryFn: () => fetchThriftShelves(tenantId.value ?? 0),
    enabled: computed(() => !!tenantId.value),
    staleTime: 10 * 60 * 1000
  });
}
