import { type NextRequest, NextResponse } from "next/server"
import {
  getProductsByShelfAndLayer,
  saveProduct,
  deleteProduct,
  getAllProducts,
  type ShelfId,
  type Layer,
} from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shelfId = searchParams.get("shelfId") as ShelfId | null
    const layer = searchParams.get("layer") as Layer | null

    console.log(`🚫 MOCK API: GET request - shelfId: ${shelfId}, layer: ${layer}`)

    if (shelfId && layer) {
      const products = await getProductsByShelfAndLayer(shelfId, layer)
      console.log(`🚫 MOCK API: returning ${products.length} products for ${shelfId} - ${layer}`)
      return NextResponse.json({ products })
    } else {
      const allProducts = await getAllProducts()
      console.log(`🚫 MOCK API: returning ${allProducts.length} total products`)
      return NextResponse.json({ products: allProducts })
    }
  } catch (error) {
    console.error("🚫 MOCK API: GET error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { product, username, isUpdate } = data

    console.log(
      `🚫 MOCK API: POST request - product: ${product.urunAdi}, shelf: ${product.rafNo}, layer: ${product.katman}, username: ${username}, isUpdate: ${isUpdate}`,
    )

    const success = await saveProduct(product, username, isUpdate)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to save product" }, { status: 500 })
    }
  } catch (error) {
    console.error("🚫 MOCK API: POST error:", error)
    return NextResponse.json(
      {
        error: "Failed to save product",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json()
    const { product, username } = data

    console.log(`🚫 MOCK API: DELETE request - product: ${product.id}, username: ${username}`)

    const success = await deleteProduct(product, username)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
    }
  } catch (error) {
    console.error("🚫 MOCK API: DELETE error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete product",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
