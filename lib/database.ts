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

// Test if tables exist and create them if they don't
async function ensureTablesExist() {
  try {
    const supabase = createServerClient()

    // Test if the main table exists by trying to query it
    const { error } = await supabase
      .from("Depo_Ruzgar_Products")
      .select("count", { count: "exact", head: true })
      .limit(1)

    if (error && error.code === "42P01") {
      // Table doesn't exist
      console.error("❌ Depo_Ruzgar tables don't exist. Please run the SQL scripts first!")
      throw new Error("Database tables are missing. Please run the SQL scripts to create the required tables.")
    }

    return true
  } catch (error) {
    console.error("Database table check failed:", error)
    throw error
  }
}

// Get products by shelf and layer
export async function getProductsByShelfAndLayer(shelfId: ShelfId, layer: Layer): Promise<Product[]> {
  try {
    await ensureTablesExist()

    console.log(`Fetching products for shelf: ${shelfId}, layer: ${layer}`)

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("Depo_Ruzgar_Products")
      .select("*")
      .eq("raf_no", shelfId)
      .eq("katman", layer)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error in getProductsByShelfAndLayer:", error)
      throw error
    }

    const products = (data || []).map(fromSupabaseProduct)
    console.log(`Found ${products.length} products`)
    return products
  } catch (error) {
    console.error("Error in getProductsByShelfAndLayer:", error)
    throw error
  }
}

// Get all products
export async function getAllProducts(): Promise<Product[]> {
  try {
    await ensureTablesExist()

    console.log("Fetching all products")

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("Depo_Ruzgar_Products")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error in getAllProducts:", error)
      throw error
    }

    const products = (data || []).map(fromSupabaseProduct)
    console.log(`Found ${products.length} total products`)
    return products
  } catch (error) {
    console.error("Error in getAllProducts:", error)
    throw error
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
  try {
    await ensureTablesExist()

    console.log(`Saving product: ${product.urunAdi}, isUpdate: ${isUpdate}`)

    const supabase = createServerClient()

    // Check if product exists
    const { data: existingData } = await supabase.from("Depo_Ruzgar_Products").select("*").eq("id", product.id).single()

    const existingProduct = existingData ? fromSupabaseProduct(existingData) : null
    const shouldMarkAsUpdate = isUpdate !== undefined ? isUpdate : !!existingProduct

    // Detect changes for updates
    let changes: FieldChange[] = []
    if (shouldMarkAsUpdate && existingProduct) {
      changes = detectChanges(existingProduct, product)
    }

    // Save product
    const productData = toSupabaseProduct(product)
    const { error } = await supabase.from("Depo_Ruzgar_Products").upsert(productData)

    if (error) {
      console.error("Supabase error in saveProduct:", error)
      throw error
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

    console.log("Product saved successfully")
    return true
  } catch (error) {
    console.error("Error in saveProduct:", error)
    throw error
  }
}

// Delete product
export async function deleteProduct(product: Product, username: string): Promise<boolean> {
  try {
    await ensureTablesExist()

    console.log(`Deleting product: ${product.id}`)

    const supabase = createServerClient()
    const { error } = await supabase.from("Depo_Ruzgar_Products").delete().eq("id", product.id)

    if (error) {
      console.error("Supabase error in deleteProduct:", error)
      throw error
    }

    // Log transaction
    await logTransaction("Silme", product.rafNo, product.katman, product.urunAdi, username, undefined, {
      urunAdi: product.urunAdi,
      olcu: product.olcu,
      kilogram: product.kilogram,
      rafNo: product.rafNo,
      katman: product.katman,
    })

    console.log("Product deleted successfully")
    return true
  } catch (error) {
    console.error("Error in deleteProduct:", error)
    throw error
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
  try {
    console.log(`Logging transaction: ${actionType} - ${urunAdi} by ${username}`)

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
      console.error("Supabase error in logTransaction:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in logTransaction:", error)
    return false
  }
}

// Get transaction logs
export async function getTransactionLogs(): Promise<any[]> {
  try {
    await ensureTablesExist()

    console.log("Fetching transaction logs")

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("Depo_Ruzgar_Transaction_Logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(1000)

    if (error) {
      console.error("Supabase error in getTransactionLogs:", error)
      throw error
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

    console.log(`Found ${logs.length} transaction logs`)
    return logs
  } catch (error) {
    console.error("Error in getTransactionLogs:", error)
    return []
  }
}

// Warehouse layout functions
export async function getWarehouseLayout(): Promise<any> {
  try {
    await ensureTablesExist()

    console.log("Fetching warehouse layout")

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("Depo_Ruzgar_Warehouse_Layouts")
      .select("*")
      .eq("id", "default")
      .single()

    if (error && error.code !== "PGRST116") {
      // Not found error
      console.error("Supabase error in getWarehouseLayout:", error)
      throw error
    }

    if (!data) {
      // Return default layout if none exists
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

      // Save default layout
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

    console.log("Warehouse layout fetched successfully")
    return layout
  } catch (error) {
    console.error("Error in getWarehouseLayout:", error)
    // Return default layout on error
    return {
      id: "default",
      name: "Varsayılan Layout",
      shelves: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }
}

// Save warehouse layout
export async function saveWarehouseLayout(layout: any): Promise<boolean> {
  try {
    await ensureTablesExist()

    console.log("Saving warehouse layout")

    const supabase = createServerClient()
    const { error } = await supabase.from("Depo_Ruzgar_Warehouse_Layouts").upsert({
      id: layout.id || "default",
      name: layout.name,
      shelves: layout.shelves,
    })

    if (error) {
      console.error("Supabase error in saveWarehouseLayout:", error)
      throw error
    }

    console.log("Warehouse layout saved successfully")
    return true
  } catch (error) {
    console.error("Error in saveWarehouseLayout:", error)
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
    console.error("Error in resetWarehouseLayout:", error)
    return false
  }
}

// Get product count by shelf
export async function getProductCountByShelf(shelfId: ShelfId): Promise<number> {
  try {
    await ensureTablesExist()

    console.log(`Counting products for shelf: ${shelfId}`)

    const supabase = createServerClient()
    const { count, error } = await supabase
      .from("Depo_Ruzgar_Products")
      .select("*", { count: "exact", head: true })
      .eq("raf_no", shelfId)

    if (error) {
      console.error("Supabase error in getProductCountByShelf:", error)
      throw error
    }

    console.log(`Found ${count || 0} products in shelf ${shelfId}`)
    return count || 0
  } catch (error) {
    console.error("Error in getProductCountByShelf:", error)
    return 0
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
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await ensureTablesExist()

    const supabase = createServerClient()
    const { data, error } = await supabase.from("Depo_Ruzgar_Products").select("count", { count: "exact", head: true })

    if (error) {
      return { success: false, message: `Supabase connection error: ${error.message}` }
    }

    return { success: true, message: `Supabase connection successful. Found ${data} products.` }
  } catch (error) {
    return {
      success: false,
      message: `Database error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
