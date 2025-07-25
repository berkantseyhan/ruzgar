import { Redis } from "@upstash/redis"
import {
  getMockProductsByShelfAndLayer,
  getAllMockProducts,
  saveMockProduct,
  deleteMockProduct,
  getMockProductById,
} from "./mock-data"

// Check if we're in development/preview mode
const isDev = process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview"

// Function to convert Redis URL format if needed
function getUpstashRedisConfig() {
  // Log available environment variables (without revealing values)
  console.log("Environment variables available:")
  console.log("REDIS_URL:", !!process.env.REDIS_URL)
  console.log("KV_URL:", !!process.env.KV_URL)
  console.log("KV_REST_API_URL:", !!process.env.KV_REST_API_URL)
  console.log("KV_REST_API_TOKEN:", !!process.env.KV_REST_API_TOKEN)
  console.log("KV_REST_API_READ_ONLY_TOKEN:", !!process.env.KV_REST_API_READ_ONLY_TOKEN)

  // First try to use KV_REST_API_URL and KV_REST_API_TOKEN which are in the correct format
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    console.log("Using KV_REST_API_URL and KV_REST_API_TOKEN")
    return {
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    }
  }

  // If KV_URL is available and in the correct format (https://), use it
  if (process.env.KV_URL && process.env.KV_URL.startsWith("https://")) {
    console.log("Using KV_URL with KV_REST_API_TOKEN")
    return {
      url: process.env.KV_URL,
      token: process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN || "",
    }
  }

  // If REDIS_URL is in the rediss:// format, we need to convert it
  if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith("rediss://")) {
    try {
      console.log("Converting REDIS_URL from rediss:// format to https:// format")
      // Parse the Redis URL
      const url = new URL(process.env.REDIS_URL)
      const host = url.hostname
      const password = url.password || url.username.split(":")[1] || ""

      // Construct the Upstash REST API URL
      const upstashUrl = `https://${host}`
      console.log(`Converted URL: ${upstashUrl} (password length: ${password.length})`)

      return {
        url: upstashUrl,
        token: password,
      }
    } catch (error) {
      console.error("Failed to parse REDIS_URL:", error)
    }
  }

  // Fallback to mock data
  console.log("No valid Redis configuration found, will use mock data")
  return { url: "", token: "" }
}

// Initialize Redis client with environment variables
let redis: Redis | null = null

try {
  const config = getUpstashRedisConfig()
  if (config.url && config.token) {
    redis = new Redis(config)
    console.log("Redis client initialized with URL:", config.url)
  } else {
    console.log("Using mock data as no valid Redis configuration was found")
    redis = null
  }
} catch (error) {
  console.error("Failed to initialize Redis client:", error)
  redis = null
}

export type Layer =
  // Default layers for regular shelves
  | "üst kat"
  | "orta kat"
  | "alt kat"
  // Layers for "çıkış yolu"
  | "dayının alanı"
  | "cam kenarı"
  | "tuvalet önü"
  | "merdiven tarafı"
  // Layers for "orta alan"
  | "a önü"
  | "b önü"
  | "c önü"
  | "mutfak yanı"
  | "tezgah yanı"
export type ShelfId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "orta alan" | "çıkış yolu"
export type ActionType = "Ekleme" | "Güncelleme" | "Silme"

// Define field names in Turkish for display in logs
export const fieldNames = {
  urunAdi: "Ürün Adı",
  kategori: "Kategori",
  olcu: "Ölçü",
  rafNo: "Raf No",
  katman: "Katman",
  kilogram: "Kilogram",
  notlar: "Notlar",
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
  changes?: FieldChange[] // Array of field changes for updates
  productDetails?: Partial<Product> // Product details for add/delete actions
}

// Layout interfaces for warehouse map
export interface ShelfLayout {
  id: ShelfId
  x: number // Position X as percentage
  y: number // Position Y as percentage
  width: number // Width as percentage
  height: number // Height as percentage
  isCommon?: boolean
  customLayers?: string[] // Custom layers for this shelf
}

export interface WarehouseLayout {
  id: string
  name: string
  shelves: ShelfLayout[]
  createdAt: number
  updatedAt: number
}

// Default warehouse layout
const defaultLayout: WarehouseLayout = {
  id: "default",
  name: "Varsayılan Layout",
  shelves: [
    // Top row: E, çıkış yolu, G
    { id: "E", x: 5, y: 5, width: 25, height: 15 },
    { id: "çıkış yolu", x: 35, y: 5, width: 30, height: 35, isCommon: true },
    { id: "G", x: 70, y: 5, width: 25, height: 15 },

    // Middle row: D, F
    { id: "D", x: 5, y: 25, width: 25, height: 15 },
    { id: "F", x: 70, y: 25, width: 25, height: 15 },

    // Middle row: B and C
    { id: "B", x: 20, y: 45, width: 20, height: 15 },
    { id: "C", x: 45, y: 45, width: 20, height: 15 },

    // Bottom row: A and orta alan
    { id: "A", x: 5, y: 55, width: 10, height: 40 },
    { id: "orta alan", x: 20, y: 75, width: 75, height: 20, isCommon: true },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

// Mock data for layouts
let mockLayout: WarehouseLayout = { ...defaultLayout }

// Mock logs for development
const mockLogs: TransactionLog[] = []

export async function getProductsByShelfAndLayer(shelfId: ShelfId, layer: Layer): Promise<Product[]> {
  const key = `${shelfId}_${layer.replace(" ", "")}`

  // Use mock data if Redis is not available or in development mode
  if (!redis || isDev) {
    console.log(`Using mock data for key: ${key}`)
    return getMockProductsByShelfAndLayer(shelfId, layer)
  }

  try {
    console.log(`Fetching products for key: ${key}`)
    const products = await redis.get<Product[]>(key)
    console.log(`Products fetched: ${products ? products.length : 0}`)
    return products || []
  } catch (error) {
    console.error("Redis error in getProductsByShelfAndLayer:", error)
    // Fallback to mock data on error
    console.log(`Falling back to mock data for key: ${key}`)
    return getMockProductsByShelfAndLayer(shelfId, layer)
  }
}

// Helper function to detect changes between two products
function detectChanges(oldProduct: Product, newProduct: Product): FieldChange[] {
  const changes: FieldChange[] = []

  // Check each field for changes
  if (oldProduct.urunAdi !== newProduct.urunAdi) {
    changes.push({
      field: "urunAdi",
      oldValue: oldProduct.urunAdi,
      newValue: newProduct.urunAdi,
    })
  }

  if (oldProduct.kategori !== newProduct.kategori) {
    changes.push({
      field: "kategori",
      oldValue: oldProduct.kategori,
      newValue: newProduct.kategori,
    })
  }

  if (oldProduct.olcu !== newProduct.olcu) {
    changes.push({
      field: "olcu",
      oldValue: oldProduct.olcu,
      newValue: newProduct.olcu,
    })
  }

  if (oldProduct.rafNo !== newProduct.rafNo) {
    changes.push({
      field: "rafNo",
      oldValue: oldProduct.rafNo,
      newValue: newProduct.rafNo,
    })
  }

  if (oldProduct.katman !== newProduct.katman) {
    changes.push({
      field: "katman",
      oldValue: oldProduct.katman,
      newValue: newProduct.katman,
    })
  }

  if (oldProduct.kilogram !== newProduct.kilogram) {
    changes.push({
      field: "kilogram",
      oldValue: oldProduct.kilogram,
      newValue: newProduct.kilogram,
    })
  }

  if (oldProduct.notlar !== newProduct.notlar) {
    changes.push({
      field: "notlar",
      oldValue: oldProduct.notlar,
      newValue: newProduct.notlar,
    })
  }

  return changes
}

// Update the saveProduct function to detect all field changes
export async function saveProduct(product: Product, username: string, isUpdate?: boolean): Promise<boolean> {
  const key = `${product.rafNo}_${product.katman.replace(" ", "")}`

  // Use mock data if Redis is not available or in development mode
  if (!redis || isDev) {
    console.log(`Using mock data to save product: ${product.urunAdi}, isUpdate: ${isUpdate}`)

    // Check for changes if this is an update
    let changes: FieldChange[] = []
    if (isUpdate) {
      // Find the existing product to compare
      const existingProduct = getMockProductById(product.id)

      if (existingProduct) {
        changes = detectChanges(existingProduct, product)
      }
    }

    const result = saveMockProduct(product)

    // If isUpdate is explicitly provided, use it
    // Otherwise check if this product already exists in the logs
    const shouldMarkAsUpdate =
      isUpdate !== undefined
        ? isUpdate
        : mockLogs.some(
            (log) => log.urunAdi === product.urunAdi && log.rafNo === product.rafNo && log.katman === product.katman,
          )

    // Only log if it's a new product or there are changes
    if (!shouldMarkAsUpdate || changes.length > 0) {
      mockLogs.unshift({
        id: Math.random().toString(36).substring(2, 15),
        timestamp: Date.now(),
        actionType: shouldMarkAsUpdate ? "Güncelleme" : "Ekleme",
        rafNo: product.rafNo,
        katman: product.katman,
        urunAdi: product.urunAdi,
        username: username || "Bilinmeyen Kullanıcı",
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

    return result
  }

  try {
    // Get existing products
    const existingProducts = (await redis.get<Product[]>(key)) || []

    // Check if product with this ID already exists
    const productIndex = existingProducts.findIndex((p) => p.id === product.id)

    // If isUpdate is explicitly provided, use it
    // Otherwise determine based on whether the product exists
    const shouldMarkAsUpdate = isUpdate !== undefined ? isUpdate : productIndex >= 0

    // Check for changes if this is an update
    let changes: FieldChange[] = []
    if (shouldMarkAsUpdate && productIndex >= 0) {
      const existingProduct = existingProducts[productIndex]
      changes = detectChanges(existingProduct, product)
    }

    if (productIndex >= 0) {
      // Update existing product
      existingProducts[productIndex] = product
    } else {
      // Add new product
      existingProducts.push(product)
    }

    // Save back to Redis
    await redis.set(key, existingProducts)

    // Only log if it's a new product or there are changes
    if (!shouldMarkAsUpdate || changes.length > 0) {
      // Log the action
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

    return true
  } catch (error) {
    console.error("Redis error in saveProduct:", error)
    // Fallback to mock data on error
    console.log(`Falling back to mock data to save product: ${product.urunAdi}`)
    return saveMockProduct(product)
  }
}

export async function deleteProduct(product: Product, username: string): Promise<boolean> {
  const key = `${product.rafNo}_${product.katman.replace(" ", "")}`

  // Use mock data if Redis is not available or in development mode
  if (!redis || isDev) {
    console.log(`Using mock data to delete product: ${product.id}`)
    const result = deleteMockProduct(product)

    // Log the action
    if (result) {
      mockLogs.unshift({
        id: Math.random().toString(36).substring(2, 15),
        timestamp: Date.now(),
        actionType: "Silme",
        rafNo: product.rafNo,
        katman: product.katman,
        urunAdi: product.urunAdi,
        username: username || "Bilinmeyen Kullanıcı",
        productDetails: {
          urunAdi: product.urunAdi,
          olcu: product.olcu,
          kilogram: product.kilogram,
          rafNo: product.rafNo,
          katman: product.katman,
        },
      })
    }

    return result
  }

  try {
    // Get existing products
    const existingProducts = (await redis.get<Product[]>(key)) || []

    // Filter out the product to delete
    const updatedProducts = existingProducts.filter((p) => p.id !== product.id)

    // Save back to Redis
    await redis.set(key, updatedProducts)

    // Log the action
    await logTransaction("Silme", product.rafNo, product.katman, product.urunAdi, username, undefined, {
      urunAdi: product.urunAdi,
      olcu: product.olcu,
      kilogram: product.kilogram,
      rafNo: product.rafNo,
      katman: product.katman,
    })

    return true
  } catch (error) {
    console.error("Redis error in deleteProduct:", error)
    // Fallback to mock data on error
    console.log(`Falling back to mock data to delete product: ${product.id}`)
    return deleteMockProduct(product)
  }
}

export async function getAllProducts(): Promise<Product[]> {
  const shelves: ShelfId[] = ["A", "B", "C", "D", "E", "F", "G", "orta alan", "çıkış yolu"]
  const layers: Layer[] = ["üst kat", "orta kat", "alt kat"]

  // Use mock data if Redis is not available or in development mode
  if (!redis || isDev) {
    console.log("Using mock data to get all products")
    return getAllMockProducts()
  }

  try {
    let allProducts: Product[] = []

    for (const shelf of shelves) {
      for (const layer of layers) {
        const products = await getProductsByShelfAndLayer(shelf, layer)
        allProducts = [...allProducts, ...products]
      }
    }

    return allProducts
  } catch (error) {
    console.error("Redis error in getAllProducts:", error)
    // Fallback to mock data on error
    console.log("Falling back to mock data to get all products")
    return getAllMockProducts()
  }
}

// Update the logTransaction function to accept the changes parameter and product details
export async function logTransaction(
  actionType: ActionType,
  rafNo: ShelfId,
  katman: Layer,
  urunAdi: string,
  username = "Bilinmeyen Kullanıcı",
  changes?: FieldChange[],
  productDetails?: Partial<Product>,
): Promise<boolean> {
  const logEntry: TransactionLog = {
    id: Math.random().toString(36).substring(2, 15),
    timestamp: Date.now(),
    actionType,
    rafNo,
    katman,
    urunAdi,
    username,
    changes,
    productDetails,
  }

  // Use mock data if Redis is not available or in development mode
  if (!redis || isDev) {
    console.log(`Using mock data to log transaction: ${actionType} - ${urunAdi} by ${username}`)
    mockLogs.unshift(logEntry)
    return true
  }

  try {
    // Get existing logs
    const logs = await getTransactionLogs()

    // Add new log at the beginning (most recent first)
    logs.unshift(logEntry)

    // Limit to 1000 logs to prevent excessive storage
    const trimmedLogs = logs.slice(0, 1000)

    // Save back to Redis
    await redis.set("transaction_logs", trimmedLogs)
    return true
  } catch (error) {
    console.error("Redis error in logTransaction:", error)
    return false
  }
}

export async function getTransactionLogs(): Promise<TransactionLog[]> {
  // Use mock data if Redis is not available or in development mode
  if (!redis || isDev) {
    console.log("Using mock data to get transaction logs")
    return mockLogs
  }

  try {
    const logs = await redis.get<TransactionLog[]>("transaction_logs")
    return logs || []
  } catch (error) {
    console.error("Redis error in getTransactionLogs:", error)
    return []
  }
}

// Layout management functions
export async function getWarehouseLayout(): Promise<WarehouseLayout> {
  // Use mock data if Redis is not available or in development mode
  if (!redis || isDev) {
    console.log("Using mock data to get warehouse layout")
    return mockLayout
  }

  try {
    const layout = await redis.get<WarehouseLayout>("warehouse_layout")
    return layout || defaultLayout
  } catch (error) {
    console.error("Redis error in getWarehouseLayout:", error)
    return defaultLayout
  }
}

export async function saveWarehouseLayout(layout: WarehouseLayout): Promise<boolean> {
  // Use mock data if Redis is not available or in development mode
  if (!redis || isDev) {
    console.log("Using mock data to save warehouse layout")
    mockLayout = { ...layout, updatedAt: Date.now() }
    return true
  }

  try {
    const updatedLayout = { ...layout, updatedAt: Date.now() }
    await redis.set("warehouse_layout", updatedLayout)
    return true
  } catch (error) {
    console.error("Redis error in saveWarehouseLayout:", error)
    return false
  }
}

export async function resetWarehouseLayout(): Promise<boolean> {
  // Use mock data if Redis is not available or in development mode
  if (!redis || isDev) {
    console.log("Using mock data to reset warehouse layout")
    mockLayout = { ...defaultLayout, updatedAt: Date.now() }
    return true
  }

  try {
    const resetLayout = { ...defaultLayout, updatedAt: Date.now() }
    await redis.set("warehouse_layout", resetLayout)
    return true
  } catch (error) {
    console.error("Redis error in resetWarehouseLayout:", error)
    return false
  }
}

// Add this function after the existing layout functions:

export async function getProductCountByShelf(shelfId: ShelfId): Promise<number> {
  const layers: Layer[] = [
    "üst kat",
    "orta kat",
    "alt kat",
    "dayının alanı",
    "cam kenarı",
    "tuvalet önü",
    "merdiven tarafı",
    "a önü",
    "b önü",
    "c önü",
    "mutfak yanı",
    "tezgah yanı",
  ]

  // Use mock data if Redis is not available or in development mode
  if (!redis || isDev) {
    console.log(`Using mock data to count products for shelf: ${shelfId}`)
    let count = 0
    for (const layer of layers) {
      const products = getMockProductsByShelfAndLayer(shelfId, layer)
      count += products.length
    }
    return count
  }

  try {
    let totalCount = 0
    for (const layer of layers) {
      const products = await getProductsByShelfAndLayer(shelfId, layer)
      totalCount += products.length
    }
    return totalCount
  } catch (error) {
    console.error("Redis error in getProductCountByShelf:", error)
    return 0
  }
}

// Add function to generate unique shelf ID
export function generateUniqueShelfId(existingShelves: ShelfLayout[]): ShelfId {
  const existingIds = existingShelves.map((shelf) => shelf.id)

  // Try letters first
  for (let i = 65; i <= 90; i++) {
    // A-Z
    const letter = String.fromCharCode(i) as ShelfId
    if (!existingIds.includes(letter)) {
      return letter
    }
  }

  // If all letters are used, try numbers
  for (let i = 1; i <= 99; i++) {
    const numberId = `${i}` as ShelfId
    if (!existingIds.includes(numberId)) {
      return numberId
    }
  }

  // Fallback
  return `Raf${Date.now()}` as ShelfId
}

// Helper function to get available layers for a shelf
export function getAvailableLayersForShelf(shelfId: ShelfId, layout?: WarehouseLayout): string[] {
  console.log(`Getting available layers for shelf: ${shelfId}`)
  console.log("Layout provided:", !!layout)

  // First check if the shelf has custom layers
  if (layout) {
    console.log(
      "Layout shelves:",
      layout.shelves.map((s) => ({ id: s.id, customLayers: s.customLayers })),
    )
    const shelf = layout.shelves.find((s) => s.id === shelfId)
    console.log(`Found shelf ${shelfId}:`, shelf)

    if (shelf?.customLayers && shelf.customLayers.length > 0) {
      console.log(`Using custom layers for shelf ${shelfId}:`, shelf.customLayers)
      return shelf.customLayers
    } else {
      console.log(`No custom layers found for shelf ${shelfId}`)
    }
  } else {
    console.log("No layout provided, using default layers")
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

// Simple function to test Redis connectivity
export async function testRedisConnection(): Promise<{ success: boolean; message: string }> {
  if (!redis) {
    return { success: false, message: "Redis client not initialized" }
  }

  try {
    const testKey = "test_connection"
    await redis.set(testKey, "Connection successful")
    const result = await redis.get(testKey)

    if (result === "Connection successful") {
      return { success: true, message: "Redis connection successful" }
    } else {
      return { success: false, message: "Redis connection test failed" }
    }
  } catch (error) {
    return {
      success: false,
      message: `Redis connection error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
