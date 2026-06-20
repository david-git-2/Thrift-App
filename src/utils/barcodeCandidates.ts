export function buildBarcodeCandidates(tenantId: number, raw: string): string[] {
  const normalized = raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
  if (!normalized) return []

  const candidates = new Set<string>([normalized])
  const tenantPrefix = tenantId.toString().padStart(2, '0')

  const fourPart = normalized.match(/^(\d+)-([A-Z]{2})-(\d{2})-(\d+)$/)
  if (fourPart && fourPart[1] && fourPart[2] && fourPart[3] && fourPart[4]) {
    candidates.add(`${fourPart[1]}-${fourPart[2]}-${fourPart[3]}-${fourPart[4].padStart(6, '0')}`)
  }

  const threePart = normalized.match(/^([A-Z]{2})-(\d{2})-(\d+)$/)
  if (threePart && threePart[1] && threePart[2] && threePart[3]) {
    candidates.add(`${tenantPrefix}-${threePart[1]}-${threePart[2]}-${threePart[3].padStart(6, '0')}`)
    candidates.add(`${tenantPrefix}-${normalized}`)
  }

  const compact = normalized.match(/^(\d+)([A-Z]{2})(\d{2})(\d+)$/)
  if (compact && compact[1] && compact[2] && compact[3] && compact[4]) {
    candidates.add(
      `${compact[1]}-${compact[2]}-${compact[3]}-${compact[4].padStart(6, '0')}`,
    )
  }

  return [...candidates]
}
