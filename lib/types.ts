export type ShelfId = string
export type Layer = string
export type ActionType = "Ekleme" | "Güncelleme" | "Silme"

export interface Product {
  id: string
  urunAdi: string
  kategori: string
  olcu: string
  rafNo: ShelfId
  katman: Layer
  kilogram: number
  notlar: string
  createdAt: number
}

export interface FieldChange {
  field: string
  oldValue: string | number
  newValue: string | number
}

export interface TransactionLog {
  id: string
  timestamp: number
  actionType: ActionType
  rafNo: ShelfId
  katman: Layer
  urunAdi: string
  username: string
  changes?: FieldChange[]
  productDetails?: Partial<Product>
  sessionInfo?: {
    loginTime?: number
    logoutTime?: number
    ipAddress?: string
  }
}

export interface ShelfLayout {
  id: ShelfId
  name?: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  layers?: number
  products?: Product[]
  isCommon?: boolean
  customLayers?: string[]
}

export interface WarehouseLayout {
  id: string
  name: string
  shelves: ShelfLayout[]
  createdAt: number
  updatedAt: number
}
