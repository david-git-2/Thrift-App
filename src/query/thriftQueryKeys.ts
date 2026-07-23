export const thriftQueryKeys = {
  all: ["thrift"] as const,
  stocks: () => [...thriftQueryKeys.all, "stocks"] as const,
  stockLists: () => [...thriftQueryKeys.stocks(), "list"] as const,
  stockList: (filters: Record<string, unknown>) =>
    [...thriftQueryKeys.stockLists(), filters] as const,
  stockDetail: (id: number) =>
    [...thriftQueryKeys.stocks(), "detail", id] as const,
  currencies: () => [...thriftQueryKeys.all, "currencies"] as const,
  catalog: () => [...thriftQueryKeys.all, "catalog"] as const,
  shelves: (tenantId: number | null) =>
    [...thriftQueryKeys.catalog(), "shelves", tenantId] as const,
  boxes: (tenantId: number | null, shelfId?: number | null) =>
    [...thriftQueryKeys.catalog(), "boxes", tenantId, shelfId] as const,
  dashboardMetrics: (tenantId: number | null) =>
    [...thriftQueryKeys.all, "dashboard-metrics", tenantId] as const
};
