export interface Product {
  id: string
  urunAdi: string
  kategori: string
  olcu: string
  rafNo: string
  katman: string
  kilogram: number
  notlar: string
  createdAt: number
}

export interface TransactionLog {
  id: string
  timestamp: number
  actionType: string
  rafNo: string
  katman: string
  urunAdi: string
  username: string
  changes?: Array<{
    field: string
    oldValue: string | number
    newValue: string | number
  }>
  productDetails?: Partial<Product>
}

// Mock products data
export const mockProducts: Product[] = [
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
  {
    id: "3",
    urunAdi: "M6 Vida",
    kategori: "vida",
    olcu: "6mm",
    rafNo: "B",
    katman: "üst kat",
    kilogram: 0.5,
    notlar: "Kısa vida",
    createdAt: Date.now() - 259200000,
  },
  {
    id: "4",
    urunAdi: "Pul 8mm",
    kategori: "pul",
    olcu: "8mm",
    rafNo: "C",
    katman: "alt kat",
    kilogram: 0.2,
    notlar: "Düz pul",
    createdAt: Date.now() - 345600000,
  },
  {
    id: "5",
    urunAdi: "M12 Saplama",
    kategori: "saplama",
    olcu: "12mm",
    rafNo: "D",
    katman: "üst kat",
    kilogram: 3.2,
    notlar: "Uzun saplama",
    createdAt: Date.now() - 432000000,
  },
]

// Mock transaction logs
export const mockTransactionLogs: TransactionLog[] = [
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
  {
    id: "log2",
    timestamp: Date.now() - 7200000,
    actionType: "Güncelleme",
    rafNo: "B",
    katman: "orta kat",
    urunAdi: "M10 Somun",
    username: "Kullanıcı1",
    changes: [
      {
        field: "kilogram",
        oldValue: 1.5,
        newValue: 1.8,
      },
    ],
  },
]

// In-memory storage
const inMemoryProducts = [...mockProducts]
let inMemoryLogs = [...mockTransactionLogs]

// Mock data functions
export function getMockProductsByShelfAndLayer(shelfId: string, layer: string): Product[] {
  return inMemoryProducts.filter((product) => product.rafNo === shelfId && product.katman === layer)
}

export function getAllMockProducts(): Product[] {
  return [...inMemoryProducts]
}

export function saveMockProduct(product: Product): boolean {
  try {
    const existingIndex = inMemoryProducts.findIndex((p) => p.id === product.id)

    if (existingIndex >= 0) {
      inMemoryProducts[existingIndex] = product
    } else {
      inMemoryProducts.push(product)
    }

    return true
  } catch (error) {
    console.error("Error saving mock product:", error)
    return false
  }
}

export function deleteMockProduct(product: Product): boolean {
  try {
    const index = inMemoryProducts.findIndex((p) => p.id === product.id)
    if (index >= 0) {
      inMemoryProducts.splice(index, 1)
      return true
    }
    return false
  } catch (error) {
    console.error("Error deleting mock product:", error)
    return false
  }
}

export function getMockProductById(id: string): Product | undefined {
  return inMemoryProducts.find((product) => product.id === id)
}

export function addMockTransactionLog(log: Omit<TransactionLog, "id">): void {
  const newLog: TransactionLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  }

  inMemoryLogs.unshift(newLog)

  // Keep only last 1000 logs
  if (inMemoryLogs.length > 1000) {
    inMemoryLogs = inMemoryLogs.slice(0, 1000)
  }
}

export function getMockTransactionLogs(): TransactionLog[] {
  return [...inMemoryLogs]
}
