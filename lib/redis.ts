// Mock-only implementation - Redis completely removed
import {
  getMockProductsByShelfAndLayer,
  getAllMockProducts,
  saveMockProduct,
  deleteMockProduct,
  getMockProductById,
  addMockTransactionLog,
  getMockTransactionLogs,
} from "./mock-data"

export type ShelfId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L"
export type Layer = "üst kat" | "orta kat" | "alt kat"

export interface Product {
  id: string
  urunAdi: string
  kategori: string
  olcu: string
  rafNo: ShelfId
  katman: Layer
  kilogram: number
  notlar?: string
  createdAt: number
}

export interface TransactionLog {
  id: string
  action: "CREATE" | "UPDATE" | "DELETE"
  productId: string
  productName: string
  shelf: string
  layer: string
  timestamp: number
  username: string
  details: string
  changes: Record<string, { old: string; new: string }>
}

export interface WarehouseLayout {
  shelves: ShelfId[]
  layers: Record<ShelfId, Layer[]>
}

// Mock warehouse layout
const mockWarehouseLayout: WarehouseLayout = {
  shelves: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"],
  layers: {
    A: ["üst kat", "orta kat", "alt kat"],
    B: ["üst kat", "orta kat", "alt kat"],
    C: ["üst kat", "orta kat", "alt kat"],
    D: ["üst kat", "orta kat", "alt kat"],
    E: ["üst kat", "orta kat", "alt kat"],
    F: ["üst kat", "orta kat", "alt kat"],
    G: ["üst kat", "orta kat", "alt kat"],
    H: ["üst kat", "orta kat", "alt kat"],
    I: ["üst kat", "orta kat", "alt kat"],
    J: ["üst kat", "orta kat", "alt kat"],
    K: ["üst kat", "orta kat", "alt kat"],
    L: ["üst kat", "orta kat", "alt kat"],
  },
}

// Mock user data
const mockUsers = new Map<string, { username: string; hashedPassword: string }>()

// Product functions
export async function getProductsByShelfAndLayer(shelfId: ShelfId, layer: Layer): Promise<Product[]> {
  console.log("🚫 MOCK: Getting products for", shelfId, layer)
  return getMockProductsByShelfAndLayer(shelfId, layer)
}

export async function getAllProducts(): Promise<Product[]> {
  console.log("🚫 MOCK: Getting all products")
  return getAllMockProducts()
}

export async function saveProduct(product: Product): Promise<boolean> {
  console.log("🚫 MOCK: Saving product", product.urunAdi)
  return saveMockProduct(product)
}

export async function deleteProduct(product: Product): Promise<boolean> {
  console.log("🚫 MOCK: Deleting product", product.urunAdi)
  return deleteMockProduct(product)
}

export async function getProductById(id: string): Promise<Product | null> {
  console.log("🚫 MOCK: Getting product by ID", id)
  return getMockProductById(id) || null
}

// Layout functions
export async function getWarehouseLayout(): Promise<WarehouseLayout> {
  console.log("🚫 MOCK: Getting warehouse layout")
  return mockWarehouseLayout
}

export async function updateWarehouseLayout(layout: WarehouseLayout): Promise<boolean> {
  console.log("🚫 MOCK: Updating warehouse layout")
  // In mock mode, we don't actually save the layout
  return true
}

export async function getAvailableLayersForShelf(shelfId: ShelfId): Promise<Layer[]> {
  console.log("🚫 MOCK: Getting available layers for shelf", shelfId)
  return mockWarehouseLayout.layers[shelfId] || ["üst kat", "orta kat", "alt kat"]
}

// Transaction log functions
export async function addTransactionLog(log: Omit<TransactionLog, "id">): Promise<void> {
  console.log("🚫 MOCK: Adding transaction log", log.action, log.productName)
  addMockTransactionLog(log)
}

export async function getTransactionLogs(): Promise<TransactionLog[]> {
  console.log("🚫 MOCK: Getting transaction logs")
  return getMockTransactionLogs()
}

// Auth functions
export async function createUser(username: string, hashedPassword: string): Promise<boolean> {
  console.log("🚫 MOCK: Creating user", username)
  mockUsers.set(username, { username, hashedPassword })
  return true
}

export async function getUserByUsername(
  username: string,
): Promise<{ username: string; hashedPassword: string } | null> {
  console.log("🚫 MOCK: Getting user", username)
  return mockUsers.get(username) || null
}

export async function testConnection(): Promise<boolean> {
  console.log("🚫 MOCK: Testing connection - always returns true")
  return true
}
