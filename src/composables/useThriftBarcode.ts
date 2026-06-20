import { supabase } from '../boot/supabase'
import { buildBarcodeCandidates } from '../utils/barcodeCandidates'
import { normalizeScannedBarcode } from '../utils/normalizeScannedBarcode'

export type BarcodeAvailability = 'available' | 'used' | 'not_found'

export interface BarcodeValidationResult {
  ok: boolean
  availability: BarcodeAvailability
  message: string
  canonicalBarcodeId?: string
}

interface BarcodeLookupRow {
  barcode_id: string
  status: string
}

async function lookupBarcodeDirect(
  tenantId: number,
  normalized: string,
): Promise<BarcodeLookupRow | null> {
  const candidates = buildBarcodeCandidates(tenantId, normalized)

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from('thrift_barcodes')
      .select('barcode_id, status')
      .eq('tenant_id', tenantId)
      .eq('barcode_id', candidate)
      .maybeSingle()

    if (error) throw error
    if (data) return data as BarcodeLookupRow
  }

  return null
}

async function lookupBarcodeViaRpc(
  tenantId: number,
  normalized: string,
): Promise<BarcodeLookupRow | null> {
  const { data, error } = await supabase.rpc('resolve_thrift_barcode', {
    p_tenant_id: tenantId,
    p_scanned_value: normalized,
  })

  if (error) throw error

  const match = Array.isArray(data) ? data[0] : data
  if (!match || typeof match !== 'object') return null
  return match as BarcodeLookupRow
}

export async function validateBarcodeForRegistration(
  tenantId: number,
  barcode: string,
): Promise<BarcodeValidationResult> {
  const normalized = normalizeScannedBarcode(barcode)
  if (!normalized) {
    return {
      ok: false,
      availability: 'not_found',
      message: 'Barcode is empty',
    }
  }

  let match: BarcodeLookupRow | null = null

  try {
    match = await lookupBarcodeViaRpc(tenantId, normalized)
  } catch (rpcError) {
    console.warn('resolve_thrift_barcode RPC failed, falling back to direct lookup:', rpcError)
    match = await lookupBarcodeDirect(tenantId, normalized)
  }

  if (!match) {
    return {
      ok: false,
      availability: 'not_found',
      message: `Barcode not found in catalog (${normalized})`,
    }
  }

  if (match.status !== 'AVAILABLE') {
    return {
      ok: false,
      availability: 'used',
      message: 'This barcode is already used',
      canonicalBarcodeId: match.barcode_id,
    }
  }

  return {
    ok: true,
    availability: 'available',
    message: 'Barcode is available',
    canonicalBarcodeId: match.barcode_id,
  }
}
