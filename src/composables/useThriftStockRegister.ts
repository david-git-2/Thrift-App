import { supabase } from "../boot/supabase";

export type { CloudinaryUploadResult } from "../utils/cloudinaryClient";
export { uploadToCloudinary } from "../utils/cloudinaryClient";
export {
  uploadStockImage,
  cleanupStockImageAssets,
  StockImageDuplicateError,
  type StockImageUploadResult
} from "../utils/stockImageClient";

export interface RegisterStockParams {
  tenantId: number;
  barcode: string;
  shipmentId: number;
  imageUrl: string;
  driveFileId?: string | null;
  brandName?: string | null;
  categoryId?: number | null;
  typeId?: number | null;
  section?: string | null;
  shelfId?: number | null;
  color?: string | null;
  size?: string | null;
  condition?: string | null;
  boxId?: number;
  productWeight?: number | null;
  extraWeight?: number | null;
  note?: string;
  originUnitPrice?: number | null;
  extraOriginUnitPrice?: number | null;
  listedUnitPrice?: number | null;
  insertedBy: string;
}

export async function registerThriftStockFromApp(
  params: RegisterStockParams
): Promise<number> {
  const { data, error } = await supabase.rpc("register_thrift_stock_from_app", {
    p_tenant_id: params.tenantId,
    p_barcode: params.barcode,
    p_shipment_id: params.shipmentId,
    p_image_url: params.imageUrl,
    p_brand_name: params.brandName ?? null,
    p_category_id: params.categoryId ?? null,
    p_type_id: params.typeId ?? null,
    p_section: params.section ?? null,
    p_shelf_id: params.shelfId ?? null,
    p_color: params.color ?? null,
    p_size: params.size ?? null,
    p_condition: params.condition ?? null,
    p_box_id: params.boxId ?? null,
    p_product_weight: params.productWeight ?? null,
    p_extra_weight: params.extraWeight ?? null,
    p_note: params.note ?? "",
    p_origin_unit_price: params.originUnitPrice ?? null,
    p_extra_origin_unit_price: params.extraOriginUnitPrice ?? null,
    p_listed_unit_price: params.listedUnitPrice ?? null,
    p_inserted_by: params.insertedBy
  });

  if (error) throw error;
  const stockId = data as number;

  if (params.driveFileId) {
    await attachDriveFileIdToStock(stockId, params.driveFileId);
  }

  return stockId;
}

export async function attachDriveFileIdToStock(
  stockId: number,
  driveFileId: string
): Promise<void> {
  const { error } = await supabase
    .from("thrift_stock_images")
    .update({ drive_file_id: driveFileId })
    .eq("stock_id", stockId)
    .eq("is_primary", true);

  if (error) throw error;
}
