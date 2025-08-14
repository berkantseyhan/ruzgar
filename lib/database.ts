import { createServerClient } from "./supabase"
import type { DepoRuzgarProduct } from "./supabase"

// Legacy types for compatibility
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

// Mock data fallback
const mockProducts: Product[] = [
  {
    id: "1",
    urunAdi: "M8 Cıvata",
    kategori: "Bağlantı Elemanları",
    olcu: "8mm x 20mm",
    rafNo: "A",
    katman: "üst kat",
    kilogram: 0.5,
    notlar: "Paslanmaz çelik",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "2",
    urunAdi: "Rüzgar Türbini Kanadı",
    kategori: "Ana Parçalar",
    olcu: "2.5m",
    rafNo: "B",
    katman: "alt kat",
    kilogram: 150.0,
    notlar: "Fiber cam malzeme",
    createdAt: Date.now() - 172800000,
  },
  {
    id: "3",
    urunAdi: "Güç Kablosu",
    kategori: "Elektrik",
    olcu: "50m",
    rafNo: "C",
    katman: "orta kat",
    kilogram: 25.0,
    notlar: "16mm² kesit",
    createdAt: Date.now() - 259200000,
  },
  {
    id: "4",
    urunAdi: "Hidrolik Yağ",
    kategori: "Sıvılar",
    olcu: "20L",
    rafNo: "D",
    katman: "alt kat",
    kilogram: 18.0,
    notlar: "ISO VG 46",
    createdAt: Date.now() - 345600000,
  },
  {
    id: "5",
    urunAdi: "Rulman 6205",
    kategori: "Mekanik Parçalar",
    olcu: "25x52x15mm",
    rafNo: "E",
    katman: "üst kat",
    kilogram: 0.13,
    notlar: "SKF marka",
    createdAt: Date.now() - 432000000,
  },
]

const mockTransactionLogs: any[] = [
  {
    id: "log1",
    timestamp: Date.now() - 3600000,
    actionType: "Ekleme",
    rafNo: "A",
    katman: "üst kat",
    urunAdi: "M8 Cıvata",
    username: "Test Kullanıcı",
    productDetails: {
      urunAdi: "M8 Cıvata",
      olcu: "8mm x 20mm",
      kilogram: 0.5,
      rafNo: "A",
      katman: "üst kat",
    },
  },
  {
    id: "log2",
    timestamp: Date.now() - 7200000,
    actionType: "Güncelleme",
    rafNo: "B",
    katman: "alt kat",
    urunAdi: "Rüzgar Türbini Kanadı",
    username: "Test Kullanıcı",
    changes: [
      {
        field: "kilogram",
        oldValue: 140.0,
        newValue: 150.0,
      },
    ],
  },
]

// Convert between legacy format and Supabase format
const toSupabaseProduct = (product: Product): Omit<DepoRuzgarProduct, "created_at" | "updated_at"> => ({
  id: product.id,
  urun_adi: product.urunAdi,
  kategori: product.kategori,
  olcu: product.olcu,
  raf_no: product.rafNo,
  katman: product.katman,
  kilogram: product.kilogram,
  notlar: product.notlar,
})

const fromSupabaseProduct = (product: DepoRuzgarProduct): Product => ({
  id: product.id,
  urunAdi: product.urun_adi,
  kategori: product.kategori,
  olcu: product.olcu,
  rafNo: product.raf_no as ShelfId,
  katman: product.katman as Layer,
  kilogram: product.kilogram,
  notlar: product.notlar,
  createdAt: new Date(product.created_at).getTime(),
})

// Check if Supabase tables exist
async function checkSupabaseTablesExist(): Promise<boolean> {
  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from("Depo_Ruzgar_Products")
      .select("count", { count: "exact", head: true })
      .limit(1)

    if (error) {
      console.log("🔄 Supabase tables don't exist, using mock data")
      return false
    }

    console.log("✅ Supabase tables exist")
    return true
  } catch (error) {
    console.log("🔄 Supabase connection failed, using mock data")
    return false
  }
}

// Get products by shelf and layer
export async function getProductsByShelfAndLayer(shelfId: ShelfId, layer: Layer): Promise<Product[]> {
  const tablesExist = await checkSupabaseTablesExist()

  if (!tablesExist) {
    console.log(`🔄 Using mock data for shelf: ${shelfId}, layer: ${layer}`)
    const filtered = mockProducts.filter((p) => p.rafNo === shelfId && p.katman === layer)
    console.log(`Found ${filtered.length} mock products`)
    return filtered
  }

  try {
    console.log(`📊 Fetching from Supabase for shelf: ${shelfId}, layer: ${layer}`)
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("Depo_Ruzgar_Products")
      .select("*")
      .eq("raf_no", shelfId)
      .eq("katman", layer)
      .order("created_at", { ascending: false })

    if (error) {
      console.log("🔄 Supabase error, falling back to mock data")
      const filtered = mockProducts.filter((p) => p.rafNo === shelfId && p.katman === layer)
      return filtered
    }

    const products = (data || []).map(fromSupabaseProduct)
    console.log(`Found ${products.length} products from Supabase`)
    return products
  } catch (error) {
    console.log("🔄 Error in getProductsByShelfAndLayer, using mock data")
    const filtered = mockProducts.filter((p) => p.rafNo === shelfId && p.katman === layer)
    return filtered
  }
}

// Get all products
export async function getAllProducts(): Promise<Product[]> {
  const tablesExist = await checkSupabaseTablesExist()

  if (!tablesExist) {
    console.log("🔄 Using mock data for all products")
    console.log(`Found ${mockProducts.length} mock products`)
    return mockProducts
  }

  try {
    console.log("📊 Fetching all products from Supabase")
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("Depo_Ruzgar_Products")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.log("🔄 Supabase error, falling back to mock data")
      return mockProducts
    }

    const products = (data || []).map(fromSupabaseProduct)
    console.log(`Found ${products.length} products from Supabase`)
    return products
  } catch (error) {
    console.log("🔄 Error in getAllProducts, using mock data")
    return mockProducts
  }
}

// Detect changes between products
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

// Save product (create or update)
export async function saveProduct(product: Product, username: string, isUpdate?: boolean): Promise<boolean> {
  const tablesExist = await checkSupabaseTablesExist()

  if (!tablesExist) {
    console.log("🔄 Using mock data for save product")

    // Find existing product in mock data
    const existingIndex = mockProducts.findIndex((p) => p.id === product.id)
    const existingProduct = existingIndex >= 0 ? mockProducts[existingIndex] : null
    const shouldMarkAsUpdate = isUpdate !== undefined ? isUpdate : !!existingProduct

    // Detect changes for updates
    let changes: FieldChange[] = []
    if (shouldMarkAsUpdate && existingProduct) {
      changes = detectChanges(existingProduct, product)
    }

    // Update mock data
    if (existingIndex >= 0) {
      mockProducts[existingIndex] = { ...product, createdAt: existingProduct?.createdAt || Date.now() }
    } else {
      mockProducts.push({ ...product, createdAt: Date.now() })
    }

    // Log to mock transaction logs
    if (!shouldMarkAsUpdate || changes.length > 0) {
      mockTransactionLogs.unshift({
        id: `log${Date.now()}`,
        timestamp: Date.now(),
        actionType: shouldMarkAsUpdate ? "Güncelleme" : "Ekleme",
        rafNo: product.rafNo,
        katman: product.katman,
        urunAdi: product.urunAdi,
        username: username,
        changes: shouldMarkAsUpdate ? changes : undefined,
        productDetails: shouldMarkAsUpdate
          ? undefined
          : {
              urunAdi: product.urunAdi,
              olcu: product.olcu,
              kilogram: product.kilogram,
              rafNo: product.rafNo,
              katman: product.katman,
            },
      })
    }

    console.log("✅ Product saved to mock data successfully")
    return true
  }

  try {
    console.log(`📊 Saving product to Supabase: ${product.urunAdi}, isUpdate: ${isUpdate}`)
    const supabase = createServerClient()

    // Check if product exists
    const { data: existingData, error: selectError } = await supabase
      .from("Depo_Ruzgar_Products")
      .select("*")
      .eq("id", product.id)
      .single()

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 is "not found" which is expected for new products
      console.log("🔄 Supabase select error, falling back to mock data:", selectError)
      return await saveProduct(product, username, isUpdate) // Retry with mock data
    }

    const existingProduct = existingData ? fromSupabaseProduct(existingData) : null
    const shouldMarkAsUpdate = isUpdate !== undefined ? isUpdate : !!existingProduct

    // Detect changes for updates
    let changes: FieldChange[] = []
    if (shouldMarkAsUpdate && existingProduct) {
      changes = detectChanges(existingProduct, product)
    }

    // Validate product data before saving
    if (!product.id || !product.urunAdi || !product.kategori || !product.olcu || !product.rafNo || !product.katman) {
      console.log("🔄 Invalid product data, using mock data instead")
      return await saveProduct(product, username, isUpdate) // Retry with mock data
    }

    // Save product
    const productData = toSupabaseProduct(product)
    console.log("📊 Saving product data:", productData)

    const { error: upsertError } = await supabase.from("Depo_Ruzgar_Products").upsert(productData)

    if (upsertError) {
      console.log("🔄 Supabase upsert error, falling back to mock data:", upsertError)
      return await saveProduct(product, username, isUpdate) // Retry with mock data
    }

    // Log transaction only if it's new or has changes
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

    console.log("✅ Product saved to Supabase successfully")
    return true
  } catch (error) {
    console.log("🔄 Error in saveProduct, falling back to mock data:", error)
    // Fallback to mock data
    const existingIndex = mockProducts.findIndex((p) => p.id === product.id)
    const existingProduct = existingIndex >= 0 ? mockProducts[existingIndex] : null
    const shouldMarkAsUpdate = isUpdate !== undefined ? isUpdate : !!existingProduct

    if (existingIndex >= 0) {
      mockProducts[existingIndex] = { ...product, createdAt: existingProduct?.createdAt || Date.now() }
    } else {
      mockProducts.push({ ...product, createdAt: Date.now() })
    }

    // Log to mock transaction logs
    mockTransactionLogs.unshift({
      id: `log${Date.now()}`,
      timestamp: Date.now(),
      actionType: shouldMarkAsUpdate ? "Güncelleme" : "Ekleme",
      rafNo: product.rafNo,
      katman: product.katman,
      urunAdi: product.urunAdi,
      username: username,
      productDetails: {
        urunAdi: product.urunAdi,
        olcu: product.olcu,
        kilogram: product.kilogram,
        rafNo: product.rafNo,
        katman: product.katman,
      },
    })

    console.log("✅ Product saved to mock data as fallback")
    return true
  }
}

// Delete product
export async function deleteProduct(product: Product, username: string): Promise<boolean> {
  const tablesExist = await checkSupabaseTablesExist()

  if (!tablesExist) {
    console.log("🔄 Using mock data for delete product")

    // Remove from mock data
    const index = mockProducts.findIndex((p) => p.id === product.id)
    if (index >= 0) {
      mockProducts.splice(index, 1)

      // Log to mock transaction logs
      mockTransactionLogs.unshift({
        id: `log${Date.now()}`,
        timestamp: Date.now(),
        actionType: "Silme",
        rafNo: product.rafNo,
        katman: product.katman,
        urunAdi: product.urunAdi,
        username: username,
        productDetails: {
          urunAdi: product.urunAdi,
          olcu: product.olcu,
          kilogram: product.kilogram,
          rafNo: product.rafNo,
          katman: product.katman,
        },
      })

      console.log("✅ Product deleted from mock data successfully")
      return true
    }
    return false
  }

  try {
    console.log(`📊 Deleting product from Supabase: ${product.id}`)
    const supabase = createServerClient()
    const { error } = await supabase.from("Depo_Ruzgar_Products").delete().eq("id", product.id)

    if (error) {
      console.log("🔄 Supabase delete error, falling back to mock data:", error)
      // Fallback to mock data
      const index = mockProducts.findIndex((p) => p.id === product.id)
      if (index >= 0) {
        mockProducts.splice(index, 1)
        return true
      }
      return false
    }

    // Log transaction
    await logTransaction("Silme", product.rafNo, product.katman, product.urunAdi, username, undefined, {
      urunAdi: product.urunAdi,
      olcu: product.olcu,
      kilogram: product.kilogram,
      rafNo: product.rafNo,
      katman: product.katman,
    })

    console.log("✅ Product deleted from Supabase successfully")
    return true
  } catch (error) {
    console.log("🔄 Error in deleteProduct, falling back to mock data:", error)
    // Fallback to mock data
    const index = mockProducts.findIndex((p) => p.id === product.id)
    if (index >= 0) {
      mockProducts.splice(index, 1)
      return true
    }
    return false
  }
}

// Log transaction
export async function logTransaction(
  actionType: ActionType,
  rafNo: ShelfId,
  katman: Layer,
  urunAdi: string,
  username = "Bilinmeyen Kullanıcı",
  changes?: FieldChange[],
  productDetails?: Partial<Product>,
): Promise<boolean> {
  const tablesExist = await checkSupabaseTablesExist()

  if (!tablesExist) {
    console.log("🔄 Using mock data for log transaction")
    mockTransactionLogs.unshift({
      id: `log${Date.now()}`,
      timestamp: Date.now(),
      actionType: actionType,
      rafNo: rafNo,
      katman: katman,
      urunAdi: urunAdi,
      username: username,
      changes: changes || null,
      productDetails: productDetails || null,
    })
    return true
  }

  try {
    console.log(`📊 Logging transaction to Supabase: ${actionType} - ${urunAdi} by ${username}`)
    const supabase = createServerClient()
    const { error } = await supabase.from("Depo_Ruzgar_Transaction_Logs").insert({
      action_type: actionType,
      raf_no: rafNo,
      katman: katman,
      urun_adi: urunAdi,
      username: username,
      changes: changes || null,
      product_details: productDetails || null,
    })

    if (error) {
      console.log("🔄 Supabase log error, using mock data:", error)
      mockTransactionLogs.unshift({
        id: `log${Date.now()}`,
        timestamp: Date.now(),
        actionType: actionType,
        rafNo: rafNo,
        katman: katman,
        urunAdi: urunAdi,
        username: username,
        changes: changes || null,
        productDetails: productDetails || null,
      })
      return true
    }

    return true
  } catch (error) {
    console.log("🔄 Error in logTransaction, using mock data:", error)
    mockTransactionLogs.unshift({
      id: `log${Date.now()}`,
      timestamp: Date.now(),
      actionType: actionType,
      rafNo: rafNo,
      katman: katman,
      urunAdi: urunAdi,
      username: username,
      changes: changes || null,
      productDetails: productDetails || null,
    })
    return true
  }
}

// Get transaction logs
export async function getTransactionLogs(): Promise<any[]> {
  const tablesExist = await checkSupabaseTablesExist()

  if (!tablesExist) {
    console.log("🔄 Using mock data for transaction logs")
    console.log(`Found ${mockTransactionLogs.length} mock transaction logs`)
    return mockTransactionLogs
  }

  try {
    console.log("📊 Fetching transaction logs from Supabase")
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("Depo_Ruzgar_Transaction_Logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(1000)

    if (error) {
      console.log("🔄 Supabase error, falling back to mock data")
      return mockTransactionLogs
    }

    // Convert to legacy format
    const logs = (data || []).map((log) => ({
      id: log.id,
      timestamp: new Date(log.timestamp).getTime(),
      actionType: log.action_type,
      rafNo: log.raf_no,
      katman: log.katman,
      urunAdi: log.urun_adi,
      username: log.username,
      changes: log.changes,
      productDetails: log.product_details,
    }))

    console.log(`Found ${logs.length} transaction logs from Supabase`)
    return logs
  } catch (error) {
    console.log("🔄 Error in getTransactionLogs, using mock data")
    return mockTransactionLogs
  }
}

// Warehouse layout functions
export async function getWarehouseLayout(): Promise<any> {
  const defaultLayout = {
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

  const tablesExist = await checkSupabaseTablesExist()

  if (!tablesExist) {
    console.log("🔄 Using default layout (mock data)")
    return defaultLayout
  }

  try {
    console.log("📊 Fetching warehouse layout from Supabase")
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("Depo_Ruzgar_Warehouse_Layouts")
      .select("*")
      .eq("id", "default")
      .single()

    if (error && error.code !== "PGRST116") {
      console.log("🔄 Supabase error, using default layout")
      return defaultLayout
    }

    if (!data) {
      // Save default layout to Supabase
      await saveWarehouseLayout(defaultLayout)
      return defaultLayout
    }

    // Convert to legacy format
    const layout = {
      id: data.id,
      name: data.name,
      shelves: data.shelves,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
    }

    console.log("Warehouse layout fetched from Supabase successfully")
    return layout
  } catch (error) {
    console.log("🔄 Error in getWarehouseLayout, using default")
    return defaultLayout
  }
}

// Save warehouse layout
export async function saveWarehouseLayout(layout: any): Promise<boolean> {
  const tablesExist = await checkSupabaseTablesExist()

  if (!tablesExist) {
    console.log("🔄 Cannot save layout - Supabase tables don't exist")
    return false
  }

  try {
    console.log("📊 Saving warehouse layout to Supabase")
    const supabase = createServerClient()
    const { error } = await supabase.from("Depo_Ruzgar_Warehouse_Layouts").upsert({
      id: layout.id || "default",
      name: layout.name,
      shelves: layout.shelves,
    })

    if (error) {
      console.log("🔄 Supabase error in saveWarehouseLayout:", error)
      return false
    }

    console.log("Warehouse layout saved to Supabase successfully")
    return true
  } catch (error) {
    console.log("🔄 Error in saveWarehouseLayout:", error)
    return false
  }
}

// Reset warehouse layout
export async function resetWarehouseLayout(): Promise<boolean> {
  try {
    console.log("Resetting warehouse layout")

    const defaultLayout = {
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
    }

    return await saveWarehouseLayout(defaultLayout)
  } catch (error) {
    console.log("🔄 Error in resetWarehouseLayout:", error)
    return false
  }
}

// Get product count by shelf
export async function getProductCountByShelf(shelfId: ShelfId): Promise<number> {
  const tablesExist = await checkSupabaseTablesExist()

  if (!tablesExist) {
    console.log(`🔄 Using mock data to count products for shelf: ${shelfId}`)
    const count = mockProducts.filter((p) => p.rafNo === shelfId).length
    console.log(`Found ${count} mock products in shelf ${shelfId}`)
    return count
  }

  try {
    console.log(`📊 Counting products in Supabase for shelf: ${shelfId}`)
    const supabase = createServerClient()
    const { count, error } = await supabase
      .from("Depo_Ruzgar_Products")
      .select("*", { count: "exact", head: true })
      .eq("raf_no", shelfId)

    if (error) {
      console.log("🔄 Supabase error, using mock data")
      const mockCount = mockProducts.filter((p) => p.rafNo === shelfId).length
      return mockCount
    }

    console.log(`Found ${count || 0} products in shelf ${shelfId}`)
    return count || 0
  } catch (error) {
    console.log("🔄 Error in getProductCountByShelf, using mock data")
    const mockCount = mockProducts.filter((p) => p.rafNo === shelfId).length
    return mockCount
  }
}

// Helper functions for compatibility
export function getAvailableLayersForShelf(shelfId: ShelfId, layout?: any): string[] {
  console.log(`Getting available layers for shelf: ${shelfId}`)

  if (layout) {
    const shelf = layout.shelves.find((s: any) => s.id === shelfId)
    if (shelf?.customLayers && shelf.customLayers.length > 0) {
      console.log(`Using custom layers for shelf ${shelfId}:`, shelf.customLayers)
      return shelf.customLayers
    }
  }

  // Default layers based on shelf type
  let defaultLayers: string[]
  if (shelfId === "çıkış yolu") {
    defaultLayers = ["dayının alanı", "cam kenarı", "tuvalet önü", "merdiven tarafı"]
  } else if (shelfId === "orta alan") {
    defaultLayers = ["a önü", "b önü", "c önü", "mutfak yanı", "tezgah yanı"]
  } else {
    defaultLayers = ["üst kat", "orta kat", "alt kat"]
  }

  console.log(`Using default layers for shelf ${shelfId}:`, defaultLayers)
  return defaultLayers
}

export function generateUniqueShelfId(existingShelves: any[]): ShelfId {
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

// Test Supabase connection
export async function testSupabaseConnection(): Promise<{
  success: boolean
  message: string
  mode: string
  tables?: string[]
}> {
  const tablesExist = await checkSupabaseTablesExist()

  if (!tablesExist) {
    return {
      success: true,
      message: "Depo Rüzgar tabloları bulunamadı. Mock data kullanılıyor.",
      mode: "mock",
      tables: [],
    }
  }

  try {
    const supabase = createServerClient()
    const { count, error } = await supabase.from("Depo_Ruzgar_Products").select("count", { count: "exact", head: true })

    if (error) {
      return {
        success: false,
        message: `Supabase bağlantı hatası: ${error.message}`,
        mode: "error",
        tables: [],
      }
    }

    // Check which tables exist
    const tables = [
      "Depo_Ruzgar_Products",
      "Depo_Ruzgar_Transaction_Logs",
      "Depo_Ruzgar_Warehouse_Layouts",
      "Depo_Ruzgar_Auth_Passwords",
    ]

    return {
      success: true,
      message: `Supabase bağlantısı başarılı. ${count || 0} ürün bulundu.`,
      mode: "supabase",
      tables: tables,
    }
  } catch (error) {
    return {
      success: false,
      message: `Veritabanı hatası: ${error instanceof Error ? error.message : String(error)}`,
      mode: "error",
      tables: [],
    }
  }
}
