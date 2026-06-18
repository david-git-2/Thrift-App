import { defineStore } from 'pinia'

export interface SelectedShipment {
  id: number
  name: string
  tenant_id: number
}

export interface SelectedBox {
  id: number
  name: string
  shipment_id: number
  tenant_id: number
}

const STORAGE_KEY = 'brandwala.thrift.store.v1'

const readStorage = () => {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const writeStorage = (state: any) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const useThriftStore = defineStore('thrift', {
  state: () => {
    const saved = readStorage()
    return {
      selectedShipment: (saved?.selectedShipment ?? null) as SelectedShipment | null,
      selectedBox: (saved?.selectedBox ?? null) as SelectedBox | null,
      tempBarcode: (saved?.tempBarcode ?? null) as string | null,
      tempImage: (saved?.tempImage ?? null) as string | null,
    }
  },
  actions: {
    setSelection(shipment: SelectedShipment | null, box: SelectedBox | null) {
      this.selectedShipment = shipment
      this.selectedBox = box
      this.saveToStorage()
    },
    clearSelection() {
      this.selectedShipment = null
      this.selectedBox = null
      this.tempBarcode = null
      this.tempImage = null
      this.saveToStorage()
    },
    setTempBarcode(barcode: string | null) {
      this.tempBarcode = barcode
      this.saveToStorage()
    },
    setTempImage(imageUrl: string | null) {
      this.tempImage = imageUrl
      this.saveToStorage()
    },
    clearTemp() {
      this.tempBarcode = null
      this.tempImage = null
      this.saveToStorage()
    },
    saveToStorage() {
      writeStorage({
        selectedShipment: this.selectedShipment,
        selectedBox: this.selectedBox,
        tempBarcode: this.tempBarcode,
        tempImage: this.tempImage,
      })
    }
  }
})
