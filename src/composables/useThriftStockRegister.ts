import { supabase } from '../boot/supabase'

export interface RegisterStockParams {
  tenantId: number
  barcode: string
  shipmentId: number
  imageUrl: string
  brandName?: string | null
  categoryId?: number | null
  typeId?: number | null
  section?: string | null
  shelfId?: number | null
  color?: string | null
  size?: string | null
  condition?: string | null
  boxId?: number
  productWeight?: number | null
  extraWeight?: number | null
  note?: string
  originPurchasePrice?: number | null
  extraOriginPurchaseExpense?: number | null
  costOfGoodsSold: number
  targetPrice: number
  listedPrice: number
  extraExpenseCost?: number | null
  insertedBy: string
}

function resizeImage(fileOrBlob: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(fileOrBlob)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        let width = img.width
        let height = img.height
        const maxWidth = 1200
        const maxHeight = 1200

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get 2D context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Canvas toBlob failed'))
          },
          'image/jpeg',
          0.85,
        )
      }
      img.onerror = () => reject(new Error('Failed to load image into object'))
    }
    reader.onerror = () => reject(new Error('Failed to read file source'))
  })
}

export async function uploadToCloudinary(blob: Blob, name: string): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment configuration missing.')
  }

  let imageToUpload = blob
  try {
    imageToUpload = await resizeImage(blob)
  } catch (err) {
    console.warn('Resize failed, uploading original blob instead', err)
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
  const formData = new FormData()
  formData.append('file', imageToUpload, name)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', 'thrift_stocks')

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errObj = await response.json()
    throw new Error(errObj.error?.message || 'Upload HTTP request failed')
  }

  const resData = await response.json()
  return resData.secure_url as string
}

export async function registerThriftStockFromApp(params: RegisterStockParams): Promise<number> {
  const { data, error } = await supabase.rpc('register_thrift_stock_from_app', {
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
    p_note: params.note ?? '',
    p_origin_purchase_price: params.originPurchasePrice ?? null,
    p_extra_origin_purchase_expense: params.extraOriginPurchaseExpense ?? null,
    p_cost_of_goods_sold: params.costOfGoodsSold,
    p_target_price: params.targetPrice,
    p_listed_price: params.listedPrice,
    p_extra_expense_cost: params.extraExpenseCost ?? null,
    p_inserted_by: params.insertedBy,
  })

  if (error) throw error
  return data as number
}
