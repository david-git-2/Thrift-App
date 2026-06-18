import { Camera } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { useQuasar } from 'quasar'

export interface PhotoCaptureResult {
  webPath: string
  blob: Blob
}

function isUserCancel(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return message.toLowerCase().includes('cancel') || message.toLowerCase().includes('dismiss')
}

async function uriToBlob(webPath: string): Promise<Blob> {
  const response = await fetch(webPath)
  return response.blob()
}

export function useProductPhoto() {
  const $q = useQuasar()

  async function capturePhoto(): Promise<PhotoCaptureResult | null> {
    if (!Capacitor.isNativePlatform()) return null

    try {
      const { camera } = await Camera.requestPermissions({ permissions: ['camera'] })
      if (camera !== 'granted' && camera !== 'limited') {
        $q.notify({ type: 'negative', message: 'Camera permission denied' })
        return null
      }

      const result = await Camera.takePhoto({
        quality: 80,
        editable: 'in-app',
      })

      if (!result.webPath) return null

      return {
        webPath: result.webPath,
        blob: await uriToBlob(result.webPath),
      }
    } catch (err) {
      if (isUserCancel(err)) return null
      throw err
    }
  }

  async function cropPhoto(webPath: string): Promise<PhotoCaptureResult | null> {
    if (!Capacitor.isNativePlatform() || !webPath) return null

    try {
      const result = await Camera.editURIPhoto({
        uri: webPath,
        saveToGallery: false,
      })

      if (!result.webPath) return null

      return {
        webPath: result.webPath,
        blob: await uriToBlob(result.webPath),
      }
    } catch (err) {
      if (isUserCancel(err)) return null
      throw err
    }
  }

  return { capturePhoto, cropPhoto }
}
