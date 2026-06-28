import { supabase } from "../boot/supabase";
import { buildBarcodeCandidates } from "../utils/barcodeCandidates";

export interface ThriftStockDetail {
  id: number;
  tenant_id: number;
  shipment_id: number;
  box_id: number | null;
  category_id: number | null;
  type_id: number | null;
  shelf_id: number | null;
  name: string | null;
  brand_name: string | null;
  color: string | null;
  size: string | null;
  condition: string | null;
  section: string | null;
  barcode: string | null;
  status: string;
  product_weight: number | null;
  extra_weight: number | null;
  note: string | null;
  origin_unit_price: number | null;
  extra_origin_unit_price: number | null;
  listed_unit_price: number;
  image_url: string;
  drive_file_id: string;
  shelf_code: string;
  shelf_name: string;
  shipment_name: string;
  box_name: string;
}

function embedFirst<T extends Record<string, unknown>>(
  value: T | T[] | null | undefined
): T {
  if (value == null) return {} as T;
  if (Array.isArray(value)) return (value[0] ?? {}) as T;
  return value as T;
}

function embedList<T extends Record<string, unknown>>(
  value: T | T[] | null | undefined
): T[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function pickPrimaryImage(
  imgs: Array<Record<string, unknown>>
): Record<string, unknown> | undefined {
  return (
    imgs.find(i => i.is_primary === true) ||
    imgs.find(i => typeof i.image_url === "string" && i.image_url.trim()) ||
    imgs[0]
  );
}

async function fetchPrimaryStockImageUrl(stockId: number): Promise<string> {
  const { data, error } = await supabase
    .from("thrift_stock_images")
    .select("image_url, is_primary")
    .eq("stock_id", stockId);

  if (error) {
    console.warn("Direct stock image query failed:", error);
    return "";
  }

  const primaryImg = pickPrimaryImage(
    embedList(data as Array<Record<string, unknown>> | null)
  );
  return typeof primaryImg?.image_url === "string"
    ? primaryImg.image_url.trim()
    : "";
}

export async function fetchThriftStockById(
  tenantId: number,
  stockId: number
): Promise<ThriftStockDetail | null> {
  const fullSelect = `
        id,
        tenant_id,
        shipment_id,
        box_id,
        category_id,
        type_id,
        shelf_id,
        name,
        brand_name,
        color,
        size,
        condition,
        section,
        barcode,
        status,
        product_weight,
        extra_weight,
        note,
        origin_unit_price,
        extra_origin_unit_price,
        thrift_pricings (
          listed_unit_price
        ),
        thrift_stock_images (
          image_url,
          drive_file_id,
          is_primary
        ),
        thrift_shelves (
          shelf_code,
          name
        ),
        thrift_shipments (
          name
        ),
        thrift_boxes (
          name
        )
      `;

  const minimalSelect = `
        id,
        tenant_id,
        shipment_id,
        box_id,
        category_id,
        type_id,
        shelf_id,
        name,
        brand_name,
        color,
        size,
        condition,
        section,
        barcode,
        status,
        product_weight,
        extra_weight,
        note,
        thrift_pricings (
          listed_unit_price
        ),
        thrift_stock_images (
          image_url,
          drive_file_id,
          is_primary
        ),
        thrift_shelves (
          shelf_code,
          name
        ),
        thrift_shipments (
          name
        ),
        thrift_boxes (
          name
        )
      `;

  let data: Record<string, unknown> | null = null;
  let error: { message?: string } | null = null;

  const fullResult = await supabase
    .from("thrift_stocks")
    .select(fullSelect)
    .eq("tenant_id", tenantId)
    .eq("id", stockId)
    .maybeSingle();

  if (fullResult.error) {
    console.warn(
      "Full stock detail query failed, retrying minimal select:",
      fullResult.error
    );
    const minimalResult = await supabase
      .from("thrift_stocks")
      .select(minimalSelect)
      .eq("tenant_id", tenantId)
      .eq("id", stockId)
      .maybeSingle();
    data = minimalResult.data as Record<string, unknown> | null;
    error = minimalResult.error;
  } else {
    data = fullResult.data as Record<string, unknown> | null;
    error = fullResult.error;
  }

  if (error) throw error;
  if (!data) return null;

  const raw = data;
  const pricing = embedFirst(
    raw.thrift_pricings as
      | Record<string, unknown>
      | Array<Record<string, unknown>>
      | null
  );
  const imgs = embedList(
    raw.thrift_stock_images as
      | Record<string, unknown>
      | Array<Record<string, unknown>>
      | null
  );
  const primaryImg = pickPrimaryImage(imgs);
  const shelf = embedFirst(
    raw.thrift_shelves as
      | Record<string, unknown>
      | Array<Record<string, unknown>>
      | null
  );
  const shipment = embedFirst(
    raw.thrift_shipments as
      | Record<string, unknown>
      | Array<Record<string, unknown>>
      | null
  );
  const box = embedFirst(
    raw.thrift_boxes as
      | Record<string, unknown>
      | Array<Record<string, unknown>>
      | null
  );

  let imageUrl =
    typeof primaryImg?.image_url === "string"
      ? primaryImg.image_url.trim()
      : "";
  const driveFileId =
    typeof primaryImg?.drive_file_id === "string"
      ? primaryImg.drive_file_id.trim()
      : "";

  if (!imageUrl) {
    imageUrl = await fetchPrimaryStockImageUrl(stockId);
  }

  return {
    id: raw.id as number,
    tenant_id: raw.tenant_id as number,
    shipment_id: raw.shipment_id as number,
    box_id: (raw.box_id as number | null) ?? null,
    category_id: (raw.category_id as number | null) ?? null,
    type_id: (raw.type_id as number | null) ?? null,
    shelf_id: (raw.shelf_id as number | null) ?? null,
    name: (raw.name as string | null) ?? null,
    brand_name: (raw.brand_name as string | null) ?? null,
    color: (raw.color as string | null) ?? null,
    size: (raw.size as string | null) ?? null,
    condition: (raw.condition as string | null) ?? null,
    section: (raw.section as string | null) ?? null,
    barcode: (raw.barcode as string | null) ?? null,
    status: (raw.status as string) || "AVAILABLE",
    product_weight:
      raw.product_weight != null ? Number(raw.product_weight) : null,
    extra_weight: raw.extra_weight != null ? Number(raw.extra_weight) : null,
    note: (raw.note as string | null) ?? null,
    origin_unit_price:
      raw.origin_unit_price != null ? Number(raw.origin_unit_price) : null,
    extra_origin_unit_price:
      raw.extra_origin_unit_price != null
        ? Number(raw.extra_origin_unit_price)
        : null,
    listed_unit_price: Number(pricing.listed_unit_price) || 0,
    image_url: imageUrl,
    drive_file_id: driveFileId,
    shelf_code: (shelf.shelf_code as string) || "",
    shelf_name: (shelf.name as string) || "",
    shipment_name: (shipment.name as string) || "",
    box_name: (box.name as string) || ""
  };
}

export async function fetchThriftStockByBarcode(
  tenantId: number,
  barcode: string
): Promise<ThriftStockDetail | null> {
  const trimmed = barcode.trim();
  if (!trimmed) return null;

  const candidates = [
    ...new Set([trimmed, ...buildBarcodeCandidates(tenantId, trimmed)])
  ];

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from("thrift_stocks")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("barcode", candidate)
      .maybeSingle();

    if (error) throw error;
    if (data?.id) {
      return fetchThriftStockById(tenantId, data.id as number);
    }
  }

  return null;
}
