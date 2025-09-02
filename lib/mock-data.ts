import type { Product, TransactionLog } from "./redis"

// In-memory storage for mock data
let mockProducts: Product[] = [
  {
    id: "1",
    urunAdi: "M8 Civata",
    kategori: "civata",
    olcu: "8mm",
    rafNo: "A",
    katman: "üst kat",
    kilogram: 2.5,
    notlar: "Paslanmaz çelik",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "2",
    urunAdi: "M10 Somun",
    kategori: "somun",
    olcu: "10mm",
    rafNo: "A",
    katman: "orta kat",
    kilogram: 1.8,
    notlar: "Galvanizli",
    createdAt: Date.now() - 172800000,
  },
]

const mockTransactionLogs: TransactionLog[] = [
  {
    id: "log1",
    timestamp: Date.now() - 3600000,
    actionType: "Ekleme",
    rafNo: "A",
    katman: "üst kat",
    urunAdi: "M8 Civata",
    username: "Admin",
    productDetails: {
      urunAdi: "M8 Civata",
      olcu: "8mm",
      kilogram: 2.5,
      rafNo: "A",
      katman: "üst kat",
    },
  },
]

// Product functions
export function getMockProductsByShelfAndLayer(shelfId: string, layer: string): Product[] {
  return mockProducts.filter((product) => product.rafNo === shelfId && product.katman === layer)
}

export function getAllMockProducts(): Product[] {
  return [...mockProducts]
}

export function saveMockProduct(product: Product): boolean {
  try {
    const existingIndex = mockProducts.findIndex((p) => p.id === product.id)

    if (existingIndex >= 0) {
      // Update existing product
      mockProducts[existingIndex] = { ...product }
    } else {
      // Add new product
      mockProducts.push({ ...product })
    }

    return true
  } catch (error) {
    console.error("Error saving mock product:", error)
    return false
  }
}

export function deleteMockProduct(product: Product): boolean {
  try {
    const initialLength = mockProducts.length
    mockProducts = mockProducts.filter((p) => p.id !== product.id)
    return mockProducts.length < initialLength
  } catch (error) {
    console.error("Error deleting mock product:", error)
    return false
  }
}

export function getMockProductById(id: string): Product | undefined {
  return mockProducts.find((product) => product.id === id)
}

// Transaction log functions
export function addMockTransactionLog(log: Omit<TransactionLog, "id">): boolean {
  try {
    const newLog: TransactionLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    mockTransactionLogs.push(newLog)
    return true
  } catch (error) {
    console.error("Error adding mock transaction log:", error)
    return false
  }
}

export function getMockTransactionLogs(): TransactionLog[] {
  return [...mockTransactionLogs].sort((a, b) => b.timestamp - a.timestamp)
}
