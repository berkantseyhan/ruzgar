import { v4 as uuidv4 } from "uuid"
import type { Product, ShelfId, Layer } from "./redis"

// Mock data for development and fallback
const mockProducts: Record<string, Product[]> = {
  A_üstkat: [
    {
      id: uuidv4(),
      urunAdi: "M8 Somun",
      kategori: "somun",
      olcu: "M8",
      rafNo: "A",
      katman: "üst kat",
      kilogram: 5.2,
      notlar: "Paslanmaz çelik",
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: uuidv4(),
      urunAdi: "M10 Vida",
      kategori: "vida",
      olcu: "M10x50",
      rafNo: "A",
      katman: "üst kat",
      kilogram: 7.5,
      notlar: "Galvanizli",
      createdAt: Date.now() - 86400000,
    },
  ],
  B_ortakat: [
    {
      id: uuidv4(),
      urunAdi: "M6 Pul",
      kategori: "pul",
      olcu: "M6",
      rafNo: "B",
      katman: "orta kat",
      kilogram: 2.3,
      notlar: "Düz pul",
      createdAt: Date.now() - 86400000 * 3,
    },
  ],
  C_altkat: [
    {
      id: uuidv4(),
      urunAdi: "M12 Civata",
      kategori: "civata",
      olcu: "M12x75",
      rafNo: "C",
      katman: "alt kat",
      kilogram: 12.8,
      notlar: "Yüksek dayanımlı",
      createdAt: Date.now() - 86400000 * 4,
    },
  ],
}

export function getMockProductsByShelfAndLayer(shelfId: ShelfId, layer: Layer): Product[] {
  const key = `${shelfId}_${layer.replace(" ", "")}`
  return mockProducts[key] || []
}

export function getAllMockProducts(): Product[] {
  return Object.values(mockProducts).flat()
}

export function saveMockProduct(product: Product): boolean {
  const key = `${product.rafNo}_${product.katman.replace(" ", "")}`

  if (!mockProducts[key]) {
    mockProducts[key] = []
  }

  const index = mockProducts[key].findIndex((p) => p.id === product.id)

  if (index >= 0) {
    mockProducts[key][index] = product
  } else {
    mockProducts[key].push(product)
  }

  return true
}

export function deleteMockProduct(product: Product): boolean {
  const key = `${product.rafNo}_${product.katman.replace(" ", "")}`

  if (!mockProducts[key]) {
    return false
  }

  const index = mockProducts[key].findIndex((p) => p.id === product.id)

  if (index >= 0) {
    mockProducts[key].splice(index, 1)
    return true
  }

  return false
}

// Add a function to find a product by ID
export function getMockProductById(id: string): Product | undefined {
  for (const key in mockProducts) {
    const product = mockProducts[key].find((p) => p.id === id)
    if (product) {
      return product
    }
  }
  return undefined
}
