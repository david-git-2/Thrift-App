import { supabase } from "../boot/supabase";

export interface UpdateThriftStockParams {
  stockId: number;
  stock: {
    name?: string | null;
    brand_name?: string | null;
    category_id?: number | null;
    type_id?: number | null;
    shelf_id?: number | null;
    color?: string | null;
    size?: string | null;
    condition?: string | null;
    section?: string | null;
    status?: string;
    product_weight?: number | null;
    extra_weight?: number | null;
    note?: string | null;
    origin_unit_price?: number | null;
    extra_origin_unit_price?: number | null;
  };
  pricing: {
    listed_unit_price: number;
  };
  imageUrl?: string | null;
  driveFileId?: string | null;
  insertedBy: string;
}

async function upsertPrimaryStockImage(
  stockId: number,
  imageUrl: string,
  insertedBy: string,
  driveFileId?: string | null
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from("thrift_stock_images")
    .select("id")
    .eq("stock_id", stockId)
    .eq("is_primary", true)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing?.id) {
    const { error } = await supabase
      .from("thrift_stock_images")
      .update({
        image_url: imageUrl,
        drive_file_id: driveFileId ?? null
      })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("thrift_stock_images").insert({
    stock_id: stockId,
    image_url: imageUrl,
    drive_file_id: driveFileId ?? null,
    is_primary: true,
    inserted_by: insertedBy
  });
  if (error) throw error;
}

async function deletePrimaryStockImage(stockId: number): Promise<void> {
  const { error } = await supabase
    .from("thrift_stock_images")
    .delete()
    .eq("stock_id", stockId)
    .eq("is_primary", true);

  if (error) throw error;
}

export async function updateThriftStock(
  params: UpdateThriftStockParams
): Promise<void> {
  const { data: stockData, error: stockError } = await supabase
    .from("thrift_stocks")
    .update(params.stock)
    .eq("id", params.stockId)
    .select("inserted_by")
    .single();

  if (stockError) throw stockError;

  const insertedBy = stockData.inserted_by || params.insertedBy;

  const { error: pricingError } = await supabase.from("thrift_pricings").upsert(
    {
      stock_id: params.stockId,
      listed_unit_price: params.pricing.listed_unit_price,
      inserted_by: insertedBy
    },
    { onConflict: "stock_id" }
  );

  if (pricingError) throw pricingError;

  if (params.imageUrl !== undefined) {
    if (params.imageUrl) {
      await upsertPrimaryStockImage(
        params.stockId,
        params.imageUrl,
        insertedBy,
        params.driveFileId
      );
    } else {
      await deletePrimaryStockImage(params.stockId);
    }
  }
}
