import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import type { PluginListenerHandle } from '@capacitor/core'
import {
  BarcodeScanner,
  GoogleBarcodeScannerModuleInstallState,
} from '@capacitor-mlkit/barcode-scanning'
import { useQuasar } from 'quasar'

export const barcodeScanOverlayActive = ref(false)

let cancelOverlayScan: (() => void) | null = null

export function cancelBarcodeOverlayScan() {
  cancelOverlayScan?.()
}

function isScanCanceled(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return message.toLowerCase().includes('scan canceled')
}

function isAlreadyInstalled(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return message.toLowerCase().includes('already installed')
}

async function ensureGoogleBarcodeScannerModule(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return

  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable()
  if (available) return

  await new Promise<void>((resolve, reject) => {
    let listenerHandle: PluginListenerHandle | null = null
    let settled = false

    const finish = async (fn: () => void) => {
      if (settled) return
      settled = true
      await listenerHandle?.remove()
      fn()
    }

    void (async () => {
      try {
        listenerHandle = await BarcodeScanner.addListener(
          'googleBarcodeScannerModuleInstallProgress',
          async (event) => {
            if (event.state === GoogleBarcodeScannerModuleInstallState.COMPLETED) {
              await finish(resolve)
            } else if (
              event.state === GoogleBarcodeScannerModuleInstallState.FAILED ||
              event.state === GoogleBarcodeScannerModuleInstallState.CANCELED
            ) {
              await finish(() => reject(new Error('Barcode scanner module installation failed')))
            }
          },
        )

        await BarcodeScanner.installGoogleBarcodeScannerModule()
      } catch (err) {
        if (isAlreadyInstalled(err)) {
          await finish(resolve)
          return
        }
        await finish(() => reject(err instanceof Error ? err : new Error(String(err))))
      }
    })()
  })
}

async function scanWithNativeUI(): Promise<string | null> {
  const { barcodes } = await BarcodeScanner.scan({ autoZoom: true })
  if (barcodes && barcodes.length > 0 && barcodes[0]) {
    return barcodes[0].displayValue || barcodes[0].rawValue || null
  }
  return null
}

async function scanWithCameraOverlay(): Promise<string | null> {
  return new Promise<string | null>((resolve, reject) => {
    let listenerHandle: PluginListenerHandle | null = null
    let settled = false

    const cleanup = async () => {
      barcodeScanOverlayActive.value = false
      document.body.classList.remove('barcode-scanner-active')
      cancelOverlayScan = null
      await listenerHandle?.remove()
      listenerHandle = null
      await BarcodeScanner.removeAllListeners()
      try {
        await BarcodeScanner.stopScan()
      } catch {
        // ignore stop errors during cleanup
      }
    }

    const finish = async (value: string | null) => {
      if (settled) return
      settled = true
      await cleanup()
      resolve(value)
    }

    const fail = async (err: unknown) => {
      if (settled) return
      settled = true
      await cleanup()
      reject(err instanceof Error ? err : new Error(String(err)))
    }

    cancelOverlayScan = () => {
      void finish(null)
    }

    void (async () => {
      try {
        listenerHandle = await BarcodeScanner.addListener('barcodesScanned', async (event) => {
          const first = event.barcodes?.[0]
          const value = first?.displayValue || first?.rawValue || null
          await finish(value)
        })

        document.body.classList.add('barcode-scanner-active')
        barcodeScanOverlayActive.value = true
        await BarcodeScanner.startScan()
      } catch (err) {
        await fail(err)
      }
    })()
  })
}

export function useBarcodeScan() {
  const $q = useQuasar()

  async function scanBarcode(): Promise<string | null> {
    const { supported } = await BarcodeScanner.isSupported()
    if (!supported) {
      $q.notify({ type: 'negative', message: 'Barcode scanning is not supported on this device' })
      return null
    }

    const { camera } = await BarcodeScanner.requestPermissions()
    if (camera !== 'granted' && camera !== 'limited') {
      $q.notify({ type: 'negative', message: 'Camera permission denied' })
      return null
    }

    let dismissLoading: (() => void) | null = null
    if (Capacitor.getPlatform() === 'android') {
      const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable()
      if (!available) {
        const loading = $q.notify({
          type: 'ongoing',
          message: 'Preparing scanner...',
          timeout: 0,
        })
        dismissLoading = () => loading()
      }
    }

    try {
      if (Capacitor.getPlatform() === 'android') {
        await ensureGoogleBarcodeScannerModule()
      }
      dismissLoading?.()

      try {
        return await scanWithNativeUI()
      } catch (nativeErr) {
        if (isScanCanceled(nativeErr)) return null
        console.warn('Native barcode UI failed, falling back to camera overlay:', nativeErr)
        return await scanWithCameraOverlay()
      }
    } catch (err) {
      dismissLoading?.()
      if (isScanCanceled(err)) return null
      throw err
    }
  }

  return { scanBarcode }
}
