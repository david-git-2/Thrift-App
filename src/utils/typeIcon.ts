export const DEFAULT_THRIFT_TYPE_ICON = 'style'

export function resolveTypeIcon(icon?: string | null): string {
  return icon?.trim() || DEFAULT_THRIFT_TYPE_ICON
}
