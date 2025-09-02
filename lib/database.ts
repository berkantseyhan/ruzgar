import { createClient } from "./supabase/client"
import type { DepoRuzgarProduct } from "./supabase"

// Types
export type ShelfId = string
export type Layer = string
export type ActionType = "Ekleme" | "Güncelleme" | "Silme" | "Giriş" | "Çıkış"

export interface Warehouse {
  id: string
  name: string
  description?: string
  color_code: string
  is_active: boolean
  created_at: number
  updated_at: number
}

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
  warehouse_id?: string
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
    userAgent?: string
  }
}

export interface ShelfLayout {
  id: ShelfId
  x: number
  y: number
  width: number
  height: number
  rotation?: number // Rotation in degrees (0, 90, 180, 270)
  isCommon?: boolean
  customLayers?: string[]
}

export interface WarehouseLayout {
  id: string
  name: string
  shelves: ShelfLayout[]
  createdAt: number
  updatedAt: number
  warehouse_id?: string
  is_active?: boolean
}

// Constants
const DEFAULT_LAYOUT_UUID = "00000000-0000-0000-0000-000000000002"
const DEFAULT_WAREHOUSE_ID = "11111111-1111-1111-1111-111111111111"

// Validation constants
const VALIDATION_LIMITS = {
  kilogram: {
    min: 0,
    max: 99999999.99, // Database DECIMAL(10,2) limit
  },
}

// Validate and sanitize kilogram value
function validateAndSanitizeKilogram(value: any): number {
  // Convert to number
  const numValue = typeof value === "number" ? value : Number.parseFloat(String(value))

  // Handle NaN
  if (isNaN(numValue)) {
    console.warn("Invalid kilogram value, defaulting to 0:", value)
    return 0
  }

  // Clamp to valid range
  if (numValue < VALIDATION_LIMITS.kilogram.min) {
    console.warn("Kilogram value too small, clamping to minimum:", numValue)
    return VALIDATION_LIMITS.kilogram.min
  }

  if (numValue > VALIDATION_LIMITS.kilogram.max) {
    console.warn("Kilogram value too large, clamping to maximum:", numValue)
    return VALIDATION_LIMITS.kilogram.max
  }

  // Round to 2 decimal places to match database precision
  return Math.round(numValue * 100) / 100
}

// Convert between legacy format and Supabase format
const toSupabaseProduct = (product: Product): Omit<DepoRuzgarProduct, "created_at" | "updated_at"> => ({
  id: product.id,
  urun_adi: product.urunAdi.substring(0, 255), // Ensure max length
  kategori: product.kategori.substring(0, 100), // Ensure max length
  olcu: product.olcu.substring(0, 100), // Ensure max length
  raf_no: product.rafNo.substring(0, 50), // Ensure max length
  katman: product.katman.substring(0, 100), // Ensure max length
  kilogram: validateAndSanitizeKilogram(product.kilogram), // Validate and sanitize
  notlar: product.notlar.substring(0, 1000), // Ensure max length
  warehouse_id: product.warehouse_id || DEFAULT_WAREHOUSE_ID,
})

const fromSupabaseProduct = (product: DepoRuzgarProduct): Product => ({
  id: product.id,
  urunAdi: product.urun_adi,
  kategori: product.kategori,
  olcu: product.olcu,
  rafNo: product.raf_no as ShelfId,
  katman: product.katman as Layer,
  kilogram: Number(product.kilogram), // Ensure it's a number
  notlar: product.notlar,
  createdAt: new Date(product.created_at).getTime(),
  warehouse_id: (product as any).warehouse_id,
})

// Check if Supabase tables exist and create them if they don't
async function ensureSupabaseTablesExist(): Promise<void> {
  try {
    const supabase = createClient()

    // Test connection with timeout
    const { error } = await Promise.race([
      supabase.from("Depo_Ruzgar_Products").select("count", { count: "exact", head: true }).limit(1),
      new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase bağlantısı zaman aşımına uğradı")), 10000),
      ),
    ])

    if (error) {
      console.error("Supabase table check error:", error)
      throw new Error(
        `Supabase tabloları kontrol edilemedi: ${error.message || error.code || "Bilinmeyen hata"}. Lütfen SQL script'lerini çalıştırın.`,
      )
    }

    console.log("✅ Supabase tabloları mevcut ve erişilebilir")
  } catch (error) {
    console.error("Error in ensureSupabaseTablesExist:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Supabase tabloları kontrol edilemedi")
  }
}

export async function getProductsByShelfAndLayer(
  shelfId: ShelfId,
  layer: Layer,
  warehouseId?: string,
): Promise<Product[]> {
  await ensureSupabaseTablesExist()

  try {
    console.log(
      `📊 Fetching from Supabase for shelf: ${shelfId}, layer: ${layer}, warehouse: ${warehouseId || "default"}`,
    )
    const supabase = createClient()

    let query = supabase.from("Depo_Ruzgar_Products").select("*").eq("raf_no", shelfId).eq("katman", layer)

    if (warehouseId) {
      query = query.eq("warehouse_id", warehouseId)
    }

    const { data, error } = await Promise.race([
      query.order("created_at", { ascending: false }),
      new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Sorgu zaman aşımına uğradı")), 15000),
      ),
    ])

    if (error) {
      console.error("Supabase query error:", error)
      throw new Error(`Ürünler yüklenirken hata: ${error.message || error.code || "Bilinmeyen hata"}`)
    }

    const products = (data || []).map(fromSupabaseProduct)
    console.log(`Found ${products.length} products from Supabase`)
    return products
  } catch (error) {
    console.error("Error in getProductsByShelfAndLayer:", error)
    throw error
  }
}

export async function getAllProducts(warehouseId?: string): Promise<Product[]> {
  await ensureSupabaseTablesExist()

  try {
    console.log(`📊 Fetching all products from Supabase for warehouse: ${warehouseId || "all"}`)
    const supabase = createClient()

    let query = supabase.from("Depo_Ruzgar_Products").select("*")

    if (warehouseId) {
      query = query.eq("warehouse_id", warehouseId)
    }

    const { data, error } = await Promise.race([
      query.order("created_at", { ascending: false }),
      new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Sorgu zaman aşımına uğradı")), 15000),
      ),
    ])

    if (error) {
      console.error("Supabase query error:", error)
      throw new Error(`Tüm ürünler yüklenirken hata: ${error.message || error.code || "Bilinmeyen hata"}`)
    }

    const products = (data || []).map(fromSupabaseProduct)
    console.log(`Found ${products.length} products from Supabase`)
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
  await ensureSupabaseTablesExist()

  try {
    console.log(`📊 Saving product to Supabase: ${product.urunAdi}, isUpdate: ${isUpdate}`)

    // Validate product data before processing
    if (
      !product.id ||
      !product.urunAdi?.trim() ||
      !product.kategori ||
      !product.olcu?.trim() ||
      !product.rafNo ||
      !product.katman
    ) {
      throw new Error("Ürün bilgileri eksik. Tüm zorunlu alanları doldurun.")
    }

    // Validate kilogram specifically
    const sanitizedKilogram = validateAndSanitizeKilogram(product.kilogram)
    if (sanitizedKilogram !== product.kilogram) {
      console.warn(`Kilogram value sanitized: ${product.kilogram} -> ${sanitizedKilogram}`)
    }

    // Create sanitized product
    const sanitizedProduct = {
      ...product,
      kilogram: sanitizedKilogram,
      urunAdi: product.urunAdi.trim(),
      olcu: product.olcu.trim(),
      notlar: product.notlar.trim(),
    }

    const supabase = createClient()

    // Check if product exists
    const { data: existingData, error: selectError } = await Promise.race([
      supabase.from("Depo_Ruzgar_Products").select("*").eq("id", sanitizedProduct.id).single(),
      new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Sorgu zaman aşımına uğradı")), 10000),
      ),
    ])

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 is "not found" which is expected for new products
      console.error("Product check error:", selectError)
      throw new Error(`Ürün kontrol edilirken hata: ${selectError.message || selectError.code || "Bilinmeyen hata"}`)
    }

    const existingProduct = existingData ? fromSupabaseProduct(existingData) : null
    const shouldMarkAsUpdate = isUpdate !== undefined ? isUpdate : !!existingProduct

    // Detect changes for updates
    let changes: FieldChange[] = []
    if (shouldMarkAsUpdate && existingProduct) {
      changes = detectChanges(existingProduct, sanitizedProduct)
    }

    // Save product
    const productData = toSupabaseProduct(sanitizedProduct)
    console.log("📊 Saving product data:", productData)

    const { error: upsertError } = await Promise.race([
      supabase.from("Depo_Ruzgar_Products").upsert(productData),
      new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Kaydetme işlemi zaman aşımına uğradı")), 15000),
      ),
    ])

    if (upsertError) {
      console.error("Product save error:", upsertError)

      // Provide more specific error messages
      if (upsertError.message?.includes("numeric field overflow")) {
        throw new Error(
          `Kilogram değeri çok büyük. Maksimum değer: ${VALIDATION_LIMITS.kilogram.max.toLocaleString("tr-TR")} kg`,
        )
      } else if (upsertError.message?.includes("value too long")) {
        throw new Error("Bir veya daha fazla alan çok uzun. Lütfen daha kısa değerler girin.")
      } else {
        throw new Error(`Ürün kaydedilirken hata: ${upsertError.message || upsertError.code || "Bilinmeyen hata"}`)
      }
    }

    // Log transaction only if it's new or has changes
    if (!shouldMarkAsUpdate || changes.length > 0) {
      await logTransaction(
        shouldMarkAsUpdate ? "Güncelleme" : "Ekleme",
        sanitizedProduct.rafNo,
        sanitizedProduct.katman,
        sanitizedProduct.urunAdi,
        username,
        shouldMarkAsUpdate ? changes : undefined,
        shouldMarkAsUpdate
          ? undefined
          : {
              urunAdi: sanitizedProduct.urunAdi,
              olcu: sanitizedProduct.olcu,
              kilogram: sanitizedProduct.kilogram,
              rafNo: sanitizedProduct.rafNo,
              katman: sanitizedProduct.katman,
            },
        undefined,
        sanitizedProduct.warehouse_id,
      )
    }

    console.log("✅ Product saved to Supabase successfully")
    return true
  } catch (error) {
    console.error("Error in saveProduct:", error)
    throw error
  }
}

// Delete product
export async function deleteProduct(product: Product, username: string): Promise<boolean> {
  await ensureSupabaseTablesExist()

  try {
    console.log(`📊 Deleting product from Supabase: ${product.id}`)
    const supabase = createClient()

    const { error } = await Promise.race([
      supabase.from("Depo_Ruzgar_Products").delete().eq("id", product.id),
      new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Silme işlemi zaman aşımına uğradı")), 10000),
      ),
    ])

    if (error) {
      console.error("Product delete error:", error)
      throw new Error(`Ürün silinirken hata: ${error.message || error.code || "Bilinmeyen hata"}`)
    }

    // Log transaction
    await logTransaction(
      "Silme",
      product.rafNo,
      product.katman,
      product.urunAdi,
      username,
      undefined,
      {
        urunAdi: product.urunAdi,
        olcu: product.olcu,
        kilogram: product.kilogram,
        rafNo: product.rafNo,
        katman: product.katman,
      },
      undefined,
      product.warehouse_id,
    )

    console.log("✅ Product deleted from Supabase successfully")
    return true
  } catch (error) {
    console.error("Error in deleteProduct:", error)
    throw error
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
  sessionInfo?: {
    loginTime?: number
    logoutTime?: number
    ipAddress?: string
    userAgent?: string
  },
  warehouseId?: string,
): Promise<boolean> {
  try {
    await ensureSupabaseTablesExist()

    console.log(`📊 Logging transaction to Supabase: ${actionType} - ${urunAdi} by ${username}`)
    const supabase = createClient()

    const { error } = await Promise.race([
      supabase.from("Depo_Ruzgar_Transaction_Logs").insert({
        action_type: actionType,
        raf_no: rafNo,
        katman: katman,
        urun_adi: urunAdi,
        username: username,
        changes: changes || null,
        product_details: productDetails || null,
        session_info: sessionInfo || null,
        warehouse_id: warehouseId || DEFAULT_WAREHOUSE_ID,
      }),
      new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Log kaydetme zaman aşımına uğradı")), 10000),
      ),
    ])

    if (error) {
      console.error("Transaction log error:", error)
      // Don't throw error for logging failures, just log it
      return false
    }

    return true
  } catch (error) {
    console.error("Error in logTransaction:", error)
    // Don't throw error for logging failures, just log it
    return false
  }
}

// Log user login
export async function logUserLogin(
  username: string,
  sessionInfo?: {
    ipAddress?: string
    userAgent?: string
  },
): Promise<boolean> {
  try {
    console.log(`📊 Logging user login: ${username}`)

    await logTransaction(
      "Giriş",
      "sistem" as ShelfId,
      "oturum" as Layer,
      "Kullanıcı Girişi",
      username,
      undefined,
      undefined,
      {
        loginTime: Date.now(),
        ...sessionInfo,
      },
    )

    return true
  } catch (error) {
    console.error("Error logging user login:", error)
    return false
  }
}

// Log user logout
export async function logUserLogout(
  username: string,
  sessionInfo?: {
    loginTime?: number
    ipAddress?: string
    userAgent?: string
  },
): Promise<boolean> {
  try {
    console.log(`📊 Logging user logout: ${username}`)

    await logTransaction(
      "Çıkış",
      "sistem" as ShelfId,
      "oturum" as Layer,
      "Kullanıcı Çıkışı",
      username,
      undefined,
      undefined,
      {
        logoutTime: Date.now(),
        ...sessionInfo,
      },
    )

    return true
  } catch (error) {
    console.error("Error logging user logout:", error)
    return false
  }
}

export async function saveWarehouseLayout(
  layout: WarehouseLayout,
  username?: string,
  warehouseId?: string,
): Promise<boolean> {
  try {
    await ensureSupabaseTablesExist()

    console.log("📊 Saving warehouse layout to Supabase")
    const supabase = createClient()

    const finalWarehouseId = warehouseId || layout.warehouse_id || DEFAULT_WAREHOUSE_ID

    const { error: deactivateError } = await supabase
      .from("Depo_Ruzgar_Warehouse_Layouts")
      .update({ is_active: false })
      .eq("warehouse_id", finalWarehouseId)

    if (deactivateError) {
      console.error("Error deactivating existing layouts:", deactivateError)
    }

    const { error } = await Promise.race([
      supabase.from("Depo_Ruzgar_Warehouse_Layouts").upsert({
        id: layout.id || DEFAULT_LAYOUT_UUID,
        name: layout.name,
        shelves: layout.shelves,
        warehouse_id: finalWarehouseId,
        is_active: true, // Always mark the saved layout as active
      }),
      new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Layout kaydetme zaman aşımına uğradı")), 10000),
      ),
    ])

    if (error) {
      console.error("Warehouse layout save error:", error)
      throw new Error(`Layout kaydedilirken hata: ${error.message || error.code || "Bilinmeyen hata"}`)
    }

    console.log("✅ Warehouse layout saved to Supabase successfully")
    return true
  } catch (error) {
    console.error("Error in saveWarehouseLayout:", error)
    return false
  }
}

export async function getWarehouseLayout(warehouseId?: string): Promise<WarehouseLayout | null> {
  try {
    await ensureSupabaseTablesExist()

    console.log(`📊 Fetching warehouse layout from Supabase for warehouse: ${warehouseId || "default"}`)
    const supabase = createClient()

    let query = supabase.from("Depo_Ruzgar_Warehouse_Layouts").select("*")

    if (warehouseId) {
      query = query.eq("warehouse_id", warehouseId).eq("is_active", true)
    } else {
      query = query.eq("id", DEFAULT_LAYOUT_UUID).eq("is_active", true)
    }

    const { data, error } = await Promise.race([
      query.single(),
      new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Layout sorgusu zaman aşımına uğradı")), 15000),
      ),
    ])

    if (error && error.code !== "PGRST116") {
      console.error("Warehouse layout query error:", error)
      throw new Error(`Layout yüklenirken hata: ${error.message || error.code || "Bilinmeyen hata"}`)
    }

    if (!data) {
      console.log("📊 No active layout found, creating default layout")
      const defaultLayout = getDefaultWarehouseLayout(warehouseId)
      const saved = await saveWarehouseLayout(defaultLayout, undefined, warehouseId)
      if (!saved) {
        throw new Error("Varsayılan layout oluşturulamadı")
      }
      return defaultLayout
    }

    // Convert to legacy format and ensure rotation property exists
    const layout: WarehouseLayout = {
      id: data.id,
      name: data.name,
      shelves: data.shelves.map((shelf: any) => ({
        ...shelf,
        rotation: shelf.rotation || 0, // Ensure rotation property exists
      })),
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
      warehouse_id: data.warehouse_id,
    }

    console.log("✅ Warehouse layout fetched from Supabase successfully")
    return layout
  } catch (error) {
    console.error("Error in getWarehouseLayout:", error)
    throw error
  }
}

// Reset warehouse layout
export async function resetWarehouseLayout(): Promise<boolean> {
  const defaultLayout = getDefaultWarehouseLayout()
  return await saveWarehouseLayout(defaultLayout)
}

export async function getProductCountByShelf(shelfId: ShelfId, warehouseId?: string): Promise<number> {
  await ensureSupabaseTablesExist()

  try {
    console.log(`📊 Counting products in Supabase for shelf: ${shelfId}, warehouse: ${warehouseId || "default"}`)
    const supabase = createClient()

    let query = supabase.from("Depo_Ruzgar_Products").select("*", { count: "exact", head: true }).eq("raf_no", shelfId)

    if (warehouseId) {
      query = query.eq("warehouse_id", warehouseId)
    }

    const { count, error } = await Promise.race([
      query,
      new Promise<{ count: number; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Sayım sorgusu zaman aşımına uğradı")), 15000),
      ),
    ])

    if (error) {
      console.error("Product count query error:", error)
      throw new Error(`Ürün sayısı alınırken hata: ${error.message || error.code || "Bilinmeyen hata"}`)
    }

    console.log(`Found ${count || 0} products in shelf ${shelfId}`)
    return count || 0
  } catch (error) {
    console.error("Error in getProductCountByShelf:", error)
    throw error
  }
}

export async function getTransactionLogs(warehouseId?: string): Promise<TransactionLog[]> {
  await ensureSupabaseTablesExist()

  try {
    console.log(`📊 Fetching transaction logs from Supabase for warehouse: ${warehouseId || "all"}`)
    const supabase = createClient()

    let query = supabase.from("Depo_Ruzgar_Transaction_Logs").select("*")

    if (warehouseId) {
      query = query.eq("warehouse_id", warehouseId)
    }

    const { data, error } = await Promise.race([
      query
        .order("created_at", { ascending: false })
        .limit(1000), // Limit to last 1000 logs for performance
      new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Log sorgusu zaman aşımına uğradı")), 15000),
      ),
    ])

    if (error) {
      console.error("Transaction logs query error:", error)
      throw new Error(`İşlem geçmişi yüklenirken hata: ${error.message || error.code || "Bilinmeyen hata"}`)
    }

    // Convert Supabase format to TransactionLog format
    const logs: TransactionLog[] = (data || []).map((log: any) => ({
      id: log.id,
      timestamp: new Date(log.created_at).getTime(),
      actionType: log.action_type as ActionType,
      rafNo: log.raf_no as ShelfId,
      katman: log.katman as Layer,
      urunAdi: log.urun_adi,
      username: log.username,
      changes: log.changes || undefined,
      productDetails: log.product_details || undefined,
      sessionInfo: log.session_info || undefined,
    }))

    console.log(`Found ${logs.length} transaction logs from Supabase`)
    return logs
  } catch (error) {
    console.error("Error in getTransactionLogs:", error)
    throw error
  }
}

// Helper functions
export function getAvailableLayersForShelf(shelfId: ShelfId, layout?: WarehouseLayout): string[] {
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

// Test Supabase connection
export async function testSupabaseConnection(): Promise<{
  success: boolean
  message: string
  mode: string
  tables?: string[]
}> {
  try {
    await ensureSupabaseTablesExist()

    const supabase = createClient()
    const { count, error } = await Promise.race([
      supabase.from("Depo_Ruzgar_Products").select("count", { count: "exact", head: true }),
      new Promise<{ count: number; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Test sorgusu zaman aşımına uğradı")), 10000),
      ),
    ])

    if (error) {
      return {
        success: false,
        message: `Supabase bağlantı hatası: ${error.message || error.code || "Bilinmeyen hata"}`,
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
      "Depo_Ruzgar_Warehouses",
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

export async function getWarehouses(): Promise<Warehouse[]> {
  await ensureSupabaseTablesExist()

  try {
    console.log("📊 Fetching warehouses from Supabase")
    const supabase = createClient()

    const { data, error } = await Promise.race([
      supabase
        .from("Depo_Ruzgar_Warehouses")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Depo sorgusu zaman aşımına uğradı")), 10000),
      ),
    ])

    if (error) {
      console.error("Warehouses query error:", error)
      throw new Error(`Depolar yüklenirken hata: ${error.message || error.code || "Bilinmeyen hata"}`)
    }

    if (!data || data.length === 0) {
      console.log("📊 No warehouses found, returning empty array")
      return []
    }

    console.log(`📊 Successfully fetched ${data.length} warehouses`)
    return data.map((warehouse: any) => ({
      id: warehouse.id,
      name: warehouse.name,
      description: warehouse.description,
      color_code: warehouse.color_code,
      is_active: warehouse.is_active,
      created_at: warehouse.created_at,
      updated_at: warehouse.updated_at,
    }))
  } catch (error) {
    console.error("Error in getWarehouses:", error)
    throw new Error(`Depolar yüklenirken hata: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function getWarehouseById(warehouseId: string): Promise<Warehouse | null> {
  await ensureSupabaseTablesExist()

  try {
    console.log(`📊 Fetching warehouse ${warehouseId} from Supabase`)
    const supabase = createClient()

    const { data, error } = await Promise.race([
      supabase.from("Depo_Ruzgar_Warehouses").select("*").eq("id", warehouseId).single(),
      new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Depo sorgusu zaman aşımına uğradı")), 10000),
      ),
    ])

    if (error && error.code !== "PGRST116") {
      console.error("Warehouse query error:", error)
      throw new Error(`Depo yüklenirken hata: ${error.message || error.code || "Bilinmeyen hata"}`)
    }

    if (!data) {
      return null
    }

    const warehouse: Warehouse = {
      id: data.id,
      name: data.name,
      description: data.description,
      color_code: data.color_code,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }

    console.log(`Found warehouse: ${warehouse.name}`)
    return warehouse
  } catch (error) {
    console.error("Error in getWarehouseById:", error)
    throw error
  }
}

export async function createWarehouse(
  warehouse: Omit<Warehouse, "id" | "created_at" | "updated_at">,
): Promise<boolean> {
  await ensureSupabaseTablesExist()

  try {
    console.log(`📊 Creating warehouse: ${warehouse.name}`)
    const supabase = createClient()

    const { error } = await Promise.race([
      supabase.from("Depo_Ruzgar_Warehouses").insert({
        name: warehouse.name,
        description: warehouse.description,
        color_code: warehouse.color_code,
        is_active: warehouse.is_active,
      }),
      new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Depo oluşturma zaman aşımına uğradı")), 10000),
      ),
    ])

    if (error) {
      console.error("Warehouse creation error:", error)
      throw new Error(`Depo oluşturulurken hata: ${error.message || error.code || "Bilinmeyen hata"}`)
    }

    console.log("✅ Warehouse created successfully")
    return true
  } catch (error) {
    console.error("Error in createWarehouse:", error)
    throw error
  }
}

function getDefaultWarehouseLayout(warehouseId?: string): WarehouseLayout {
  const layoutId = warehouseId ? generateUUID() : DEFAULT_LAYOUT_UUID

  return {
    id: layoutId,
    name: "Varsayılan Layout",
    shelves: [
      { id: "E", x: 5, y: 5, width: 25, height: 15, rotation: 0 },
      { id: "çıkış yolu", x: 35, y: 5, width: 30, height: 35, rotation: 0, isCommon: true },
      { id: "G", x: 70, y: 5, width: 25, height: 15, rotation: 0 },
      { id: "D", x: 5, y: 25, width: 25, height: 15, rotation: 0 },
      { id: "F", x: 70, y: 25, width: 25, height: 15, rotation: 0 },
      { id: "B", x: 20, y: 45, width: 20, height: 15, rotation: 0 },
      { id: "C", x: 45, y: 45, width: 20, height: 15, rotation: 0 },
      { id: "A", x: 5, y: 55, width: 10, height: 40, rotation: 0 },
      { id: "orta alan", x: 20, y: 75, width: 75, height: 20, rotation: 0, isCommon: true },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    warehouse_id: warehouseId || DEFAULT_WAREHOUSE_ID,
    is_active: true,
  }
}

function generateUUID(): string {
  // Simple UUID v4 generation that works in all environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
