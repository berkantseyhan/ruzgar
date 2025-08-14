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

    console.log(`🔍 API: GET request - shelfId: ${shelfId}, layer: ${layer}`)

    if (shelfId && layer) {
      const products = await getProductsByShelfAndLayer(shelfId, layer)
      console.log(`✅ API: returning ${products.length} products for ${shelfId} - ${layer}`)
      return NextResponse.json({ products })
    } else {
      const allProducts = await getAllProducts()
      console.log(`✅ API: returning ${allProducts.length} total products`)
      return NextResponse.json({ products: allProducts })
    }
  } catch (error) {
    console.error("❌ API: GET error:", error)
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
      `🔍 API: POST request - product: ${product.urunAdi}, shelf: ${product.rafNo}, layer: ${product.katman}, username: ${username}, isUpdate: ${isUpdate}`,
    )

    // Validate required fields
    if (!product || !product.urunAdi || !product.kategori || !product.olcu || !product.rafNo || !product.katman) {
      console.error("❌ API: Missing required product fields")
      return NextResponse.json({ error: "Missing required product fields" }, { status: 400 })
    }

    const success = await saveProduct(product, username || "Bilinmeyen Kullanıcı", isUpdate)

    if (success) {
      console.log("✅ API: Product saved successfully")
      return NextResponse.json({ success: true })
    } else {
      console.error("❌ API: Failed to save product")
      return NextResponse.json({ error: "Failed to save product" }, { status: 500 })
    }
  } catch (error) {
    console.error("❌ API: POST error:", error)
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

    console.log(`🔍 API: DELETE request - product: ${product.id}, username: ${username}`)

    if (!product || !product.id) {
      console.error("❌ API: Missing product ID")
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 })
    }

    const success = await deleteProduct(product, username || "Bilinmeyen Kullanıcı")

    if (success) {
      console.log("✅ API: Product deleted successfully")
      return NextResponse.json({ success: true })
    } else {
      console.error("❌ API: Failed to delete product")
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
    }
  } catch (error) {
    console.error("❌ API: DELETE error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete product",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
