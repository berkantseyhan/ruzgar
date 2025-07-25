import { type NextRequest, NextResponse } from "next/server"
import { getWarehouseLayout, saveWarehouseLayout, resetWarehouseLayout, type WarehouseLayout } from "@/lib/redis"

export async function GET() {
  try {
    const layout = await getWarehouseLayout()
    return NextResponse.json({ layout })
  } catch (error) {
    console.error("Error fetching warehouse layout:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch warehouse layout",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { layout } = await request.json()

    if (!layout) {
      return NextResponse.json({ error: "Layout data is required" }, { status: 400 })
    }

    const success = await saveWarehouseLayout(layout as WarehouseLayout)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to save warehouse layout" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error saving warehouse layout:", error)
    return NextResponse.json(
      {
        error: "Failed to save warehouse layout",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    const success = await resetWarehouseLayout()

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to reset warehouse layout" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error resetting warehouse layout:", error)
    return NextResponse.json(
      {
        error: "Failed to reset warehouse layout",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { action, shelfId } = await request.json()

    if (action === "checkProducts" && shelfId) {
      const { getProductCountByShelf } = await import("@/lib/redis")
      const productCount = await getProductCountByShelf(shelfId)
      return NextResponse.json({ productCount })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in layout PUT:", error)
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
