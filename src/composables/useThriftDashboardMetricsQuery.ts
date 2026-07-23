import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { supabase } from "../boot/supabase";
import { thriftQueryKeys } from "../query/thriftQueryKeys";

export interface ThriftDashboardMetrics {
  itemsAddedToday: number;
  totalItems: number;
  availableItems: number;
}

export async function fetchThriftDashboardMetrics(
  tenantId: number
): Promise<ThriftDashboardMetrics> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayIso = startOfDay.toISOString();

  // Run metric count queries in parallel
  const [addedTodayRes, totalItemsRes, availableItemsRes] = await Promise.all([
    supabase
      .from("thrift_stocks")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("created_at", startOfDayIso),
    supabase
      .from("thrift_stocks")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("thrift_stocks")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "AVAILABLE")
  ]);

  if (addedTodayRes.error) throw addedTodayRes.error;
  if (totalItemsRes.error) throw totalItemsRes.error;
  if (availableItemsRes.error) throw availableItemsRes.error;

  return {
    itemsAddedToday: addedTodayRes.count ?? 0,
    totalItems: totalItemsRes.count ?? 0,
    availableItems: availableItemsRes.count ?? 0
  };
}

export function useThriftDashboardMetricsQuery(tenantId: Ref<number | null>) {
  const queryKey = computed(() =>
    thriftQueryKeys.dashboardMetrics(tenantId.value)
  );

  return useQuery<ThriftDashboardMetrics>({
    queryKey,
    queryFn: async () => {
      if (!tenantId.value) {
        return {
          itemsAddedToday: 0,
          totalItems: 0,
          availableItems: 0
        };
      }
      return fetchThriftDashboardMetrics(tenantId.value);
    },
    enabled: computed(() => Boolean(tenantId.value))
  });
}
