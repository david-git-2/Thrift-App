import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''
const defaultFetch: typeof fetch = globalThis.fetch.bind(globalThis)

const trackedFetch: typeof fetch = async (input, init) => {
  const storageKey = 'brandwala.tenant.workspace.v1'
  const storageValue = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null
  let selectedTenantId: string | null = null

  if (storageValue) {
    try {
      const parsed = JSON.parse(storageValue)
      if (parsed && parsed.selectedTenantId) {
        selectedTenantId = parsed.selectedTenantId.toString()
      }
    } catch {
      // Ignore parse errors
    }
  }

  let modifiedInit = init
  if (selectedTenantId) {
    modifiedInit = { ...init }
    const headers = new Headers(modifiedInit.headers)
    headers.set('x-selected-tenant-id', selectedTenantId)
    modifiedInit.headers = headers
  }

  return await defaultFetch(input, modifiedInit)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: trackedFetch,
  },
  auth: {
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

export default ({ app }: { app: any }) => {
  app.config.globalProperties.$supabase = supabase
}
