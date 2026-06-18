import { supabase } from '../boot/supabase'

export type BarcodeAvailability = 'available' | 'used' | 'not_found'

export interface BarcodeValidationResult {
  ok: boolean
  availability: BarcodeAvailability
  message: string
}

export async function validateBarcodeForRegistration(
  tenantId: number,
  barcode: string,
): Promise<BarcodeValidationResult> {
  const trimmed = barcode.trim()
  if (!trimmed) {
    return {
      ok: false,
      availability: 'not_found',
      message: 'Barcode is empty',
    }
  }

  const { data, error } = await supabase
    .from('thrift_barcodes')
    .select('barcode_id, status')
    .eq('tenant_id', tenantId)
    .eq('barcode_id', trimmed)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    return {
      ok: false,
      availability: 'not_found',
      message: 'Barcode not found in catalog',
    }
  }

  if (data.status !== 'AVAILABLE') {
    return {
      ok: false,
      availability: 'used',
      message: 'This barcode is already used',
    }
  }

  return {
    ok: true,
    availability: 'available',
    message: 'Barcode is available',
  }
}
