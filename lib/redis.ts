import {
  getMockProductsByShelfAndLayer,
  getAllMockProducts,
  saveMockProduct,
  deleteMockProduct,
  getMockProductById,
  addMockTransactionLog,
  getMockTransactionLogs,
} from "./mock-data"

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
}

export interface ShelfLayout {
  id: ShelfId
  x: number
  y: number
  width: number
  height: number
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

// Mock warehouse layout
let mockLayoutData: WarehouseLayout = {
  id: "default",
  name: "Varsayılan Layout",
  shelves: [
    { id: "E", x: 5, y: 5, width: 25, height: 15 },
    { id: "çıkış yolu", x: 35, y: 5, width: 30, height: 35, isCommon: true },
    { id: "G", x: 70, y: 5, width: 25, height: 15 },
    { id: "D", x: 5, y: 25, width: 25, height: 15 },
    { id: "F", x: 70, y: 25, width: 25, height: 15 },
    { id: "B", x: 20, y: 45, width: 20, height: 15 },
    { id: "C", x: 45, y: 45, width: 20, height: 15 },
    { id: "A", x: 5, y: 55, width: 10, height: 40 },
    { id: "orta alan", x: 20, y: 75, width: 75, height: 20, isCommon: true },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

console.log("🚫 MOCK DATA MODE: All Redis functionality disabled")

// Product functions
export async function getProductsByShelfAndLayer(shelfId: ShelfId, layer: Layer): Promise<Product[]> {
  console.log(`🚫 MOCK: Fetching products for shelf: ${shelfId}, layer: ${layer}`)
  return getMockProductsByShelfAndLayer(shelfId, layer)
}

export async function getAllProducts(): Promise<Product[]> {
  console.log("🚫 MOCK: Fetching all products")
  return getAllMockProducts()
}

function detectChanges(oldProduct: Product, newProduct: Product): FieldChange[] {
  const changes: FieldChange[] = []
  const fields: (keyof Product)[] = ["urunAdi", "kategori", "olcu", "rafNo", "katman", "kilogram", "notlar"]

  for (const field of fields) {
    if (oldProduct[field] !== newProduct[field]) {
      changes.push({
        field: field,
        oldValue: oldProduct[field] as string | number,
        newValue: newProduct[field] as string | number,
      })
    }
  }

  return changes
}

export async function saveProduct(product: Product, username: string, isUpdate?: boolean): Promise<boolean> {
  console.log(`🚫 MOCK: Saving product: ${product.urunAdi}, isUpdate: ${isUpdate}`)

  try {
    const existingProduct = getMockProductById(product.id)
    const shouldMarkAsUpdate = isUpdate !== undefined ? isUpdate : !!existingProduct

    let changes: FieldChange[] = []
    if (shouldMarkAsUpdate && existingProduct) {
      changes = detectChanges(existingProduct, product)
    }

    const result = saveMockProduct(product)

    if (!shouldMarkAsUpdate || changes.length > 0) {
      await logTransaction(
        shouldMarkAsUpdate ? "Güncelleme" : "Ekleme",
        product.rafNo,
        product.katman,
        product.urunAdi,
        username,
        shouldMarkAsUpdate ? changes : undefined,
        shouldMarkAsUpdate
          ? undefined
          : {
              urunAdi: product.urunAdi,
              olcu: product.olcu,
              kilogram: product.kilogram,
              rafNo: product.rafNo,
              katman: product.katman,
            },
      )
    }

    return result
  } catch (error) {
    console.error("🚫 MOCK: Error in saveProduct:", error)
    return false
  }
}

export async function deleteProduct(product: Product, username: string): Promise<boolean> {
  console.log(`🚫 MOCK: Deleting product: ${product.id}`)

  try {
    const result = deleteMockProduct(product)

    if (result) {
      await logTransaction("Silme", product.rafNo, product.katman, product.urunAdi, username, undefined, {
        urunAdi: product.urunAdi,
        olcu: product.olcu,
        kilogram: product.kilogram,
        rafNo: product.rafNo,
        katman: product.katman,
      })
    }

    return result
  } catch (error) {
    console.error("🚫 MOCK: Error in deleteProduct:", error)
    return false
  }
}

export async function logTransaction(
  actionType: ActionType,
  rafNo: ShelfId,
  katman: Layer,
  urunAdi: string,
  username = "Bilinmeyen Kullanıcı",
  changes?: FieldChange[],
  productDetails?: Partial<Product>,
): Promise<boolean> {
  console.log(`🚫 MOCK: Logging transaction: ${actionType} - ${urunAdi} by ${username}`)

  try {
    addMockTransactionLog({
      timestamp: Date.now(),
      actionType,
      rafNo,
      katman,
      urunAdi,
      username,
      changes: changes || undefined,
      productDetails: productDetails || undefined,
    })

    return true
  } catch (error) {
    console.error("🚫 MOCK: Error in logTransaction:", error)
    return false
  }
}

export async function getTransactionLogs(): Promise<TransactionLog[]> {
  console.log("🚫 MOCK: Fetching transaction logs")
  return getMockTransactionLogs()
}

// Layout functions
export async function getWarehouseLayout(): Promise<WarehouseLayout> {
  console.log("🚫 MOCK: Fetching warehouse layout")
  return { ...mockLayoutData }
}

export async function saveWarehouseLayout(layout: WarehouseLayout): Promise<boolean> {
  console.log("🚫 MOCK: Saving warehouse layout")

  try {
    mockLayoutData = {
      ...layout,
      updatedAt: Date.now(),
    }
    return true
  } catch (error) {
    console.error("🚫 MOCK: Error in saveWarehouseLayout:", error)
    return false
  }
}

export async function resetWarehouseLayout(): Promise<boolean> {
  console.log("🚫 MOCK: Resetting warehouse layout")

  try {
    mockLayoutData = {
      id: "default",
      name: "Varsayılan Layout",
      shelves: [
        { id: "E", x: 5, y: 5, width: 25, height: 15 },
        { id: "çıkış yolu", x: 35, y: 5, width: 30, height: 35, isCommon: true },
        { id: "G", x: 70, y: 5, width: 25, height: 15 },
        { id: "D", x: 5, y: 25, width: 25, height: 15 },
        { id: "F", x: 70, y: 25, width: 25, height: 15 },
        { id: "B", x: 20, y: 45, width: 20, height: 15 },
        { id: "C", x: 45, y: 45, width: 20, height: 15 },
        { id: "A", x: 5, y: 55, width: 10, height: 40 },
        { id: "orta alan", x: 20, y: 75, width: 75, height: 20, isCommon: true },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    return true
  } catch (error) {
    console.error("🚫 MOCK: Error in resetWarehouseLayout:", error)
    return false
  }
}

export async function getProductCountByShelf(shelfId: ShelfId): Promise<number> {
  console.log(`🚫 MOCK: Counting products for shelf: ${shelfId}`)
  const allProducts = getAllMockProducts()
  const count = allProducts.filter((product) => product.rafNo === shelfId).length
  return count
}

export function getAvailableLayersForShelf(shelfId: ShelfId, layout?: WarehouseLayout): string[] {
  console.log(`🚫 MOCK: Getting available layers for shelf: ${shelfId}`)

  if (layout) {
    const shelf = layout.shelves.find((s) => s.id === shelfId)
    if (shelf?.customLayers && shelf.customLayers.length > 0) {
      return shelf.customLayers
    }
  }

  // Default layers based on shelf type
  if (shelfId === "çıkış yolu") {
    return ["dayının alanı", "cam kenarı", "tuvalet önü", "merdiven tarafı"]
  } else if (shelfId === "orta alan") {
    return ["a önü", "b önü", "c önü", "mutfak yanı", "tezgah yanı"]
  } else {
    return ["üst kat", "orta kat", "alt kat"]
  }
}

export function generateUniqueShelfId(existingShelves: ShelfLayout[]): ShelfId {
  const existingIds = existingShelves.map((shelf) => shelf.id)

  // Try letters first
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i)
    if (!existingIds.includes(letter)) {
      return letter
    }
  }

  // If all letters are used, try numbers
  for (let i = 1; i <= 99; i++) {
    const numberId = `${i}`
    if (!existingIds.includes(numberId)) {
      return numberId
    }
  }

  // Fallback
  return `Raf${Date.now()}`
}

export async function testRedisConnection(): Promise<{ success: boolean; message: string }> {
  console.log("🚫 MOCK: Testing connection (mock mode)")
  return { success: true, message: "Mock Data Modu Aktif - Redis Devre Dışı" }
}
