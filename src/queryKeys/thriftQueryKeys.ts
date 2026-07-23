export const thriftQueryKeys = {
  categories: (tenantId: number) =>
    ["thrift", "categories", { tenantId }] as const,
  types: (tenantId: number) => ["thrift", "types", { tenantId }] as const,
  boxes: (tenantId: number | null, shelfId?: number | null) =>
    ["thrift", "boxes", { tenantId, shelfId }] as const,
  shelves: (tenantId: number | null) => ["thrift", "shelves", { tenantId }] as const,
  currencies: () => ["thrift", "currencies"] as const,
  stockList: (params: object) => ["thrift", "stock-list", params] as const,
  stockDetail: (id: number) => ["thrift", "stock-detail", { id }] as const,
  stockByBarcode: (barcode: string) =>
    ["thrift", "stock-by-barcode", { barcode }] as const,
  barcodes: (params: object) => ["thrift", "barcodes", params] as const,
  shipments: (tenantId: number) =>
    ["thrift", "shipments", { tenantId }] as const,
  shipmentDetail: (id: number) => ["thrift", "shipment-detail", { id }] as const
};
