import { type NextRequest, NextResponse } from "next/server"
import { getWarehouseLayout, saveWarehouseLayout, getProductCountByShelf } from "@/lib/database"
import type { WarehouseLayout, ShelfId } from "@/lib/database"

const DEFAULT_LAYOUT_UUID = "00000000-0000-0000-0000-000000000002"

export async function GET() {
  try {
    console.log("GET /api/layout - Fetching warehouse layout...")

    const layout = await getWarehouseLayout()

    if (!layout) {
      console.log("No layout found, creating default layout")

      // Create default layout
      const defaultLayout: WarehouseLayout = {
        id: DEFAULT_LAYOUT_UUID,
        name: "Varsayılan Layout",
        shelves: [
          { id: "A" as ShelfId, x: 10, y: 15, width: 20, height: 15, rotation: 0, isCommon: false },
          { id: "B" as ShelfId, x: 40, y: 15, width: 20, height: 15, rotation: 0, isCommon: false },
          { id: "C" as ShelfId, x: 70, y: 15, width: 20, height: 15, rotation: 0, isCommon: false },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      // Try to save the default layout
      try {
        await saveWarehouseLayout(defaultLayout)
        console.log("Default layout saved successfully")
      } catch (saveError) {
        console.error("Error saving default layout:", saveError)
        // Continue with default layout even if save fails
      }

      return NextResponse.json({
        success: true,
        layout: defaultLayout,
        message: "Default layout created",
      })
    }

    console.log("Layout fetched successfully:", layout.id)
    return NextResponse.json({
      success: true,
      layout,
      message: "Layout fetched successfully",
    })
  } catch (error) {
    console.error("Error in GET /api/layout:", error)

    // Return a fallback layout instead of error
    const fallbackLayout: WarehouseLayout = {
      id: DEFAULT_LAYOUT_UUID,
      name: "Yedek Layout",
      shelves: [
        { id: "A" as ShelfId, x: 10, y: 15, width: 20, height: 15, rotation: 0, isCommon: false },
        { id: "B" as ShelfId, x: 40, y: 15, width: 20, height: 15, rotation: 0, isCommon: false },
        { id: "C" as ShelfId, x: 70, y: 15, width: 20, height: 15, rotation: 0, isCommon: false },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    return NextResponse.json({
      success: true,
      layout: fallbackLayout,
      message: "Fallback layout used due to database error",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/layout - Saving warehouse layout...")

    const body = await request.json()
    const { layout, username } = body

    if (!layout || !layout.id) {
      return NextResponse.json({ success: false, error: "Invalid layout data" }, { status: 400 })
    }

    // Ensure updatedAt is current and use proper UUID
    const layoutToSave = {
      ...layout,
      id: layout.id || DEFAULT_LAYOUT_UUID,
      updatedAt: Date.now(),
    }

    await saveWarehouseLayout(layoutToSave, username)

    console.log("Layout saved successfully:", layout.id)
    return NextResponse.json({
      success: true,
      message: "Layout saved successfully",
    })
  } catch (error) {
    console.error("Error in POST /api/layout:", error)
    return NextResponse.json({ success: false, error: "Failed to save layout" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("PUT /api/layout - Processing special action...")

    const body = await request.json()
    const { action, shelfId } = body

    if (action === "checkProducts" && shelfId) {
      try {
        const productCount = await getProductCountByShelf(shelfId)
        console.log(`Product count for shelf ${shelfId}:`, productCount)

        return NextResponse.json({
          success: true,
          productCount,
          message: `Found ${productCount} products on shelf ${shelfId}`,
        })
      } catch (error) {
        console.error("Error checking products:", error)
        // Return 0 if we can't check products
        return NextResponse.json({
          success: true,
          productCount: 0,
          message: "Could not check products, assuming 0",
        })
      }
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in PUT /api/layout:", error)
    return NextResponse.json({ success: false, error: "Failed to process action" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    console.log("DELETE /api/layout - Resetting to default layout...")

    const defaultLayout: WarehouseLayout = {
      id: DEFAULT_LAYOUT_UUID,
      name: "Varsayılan Layout",
      shelves: [
        { id: "A" as ShelfId, x: 10, y: 15, width: 20, height: 15, rotation: 0, isCommon: false },
        { id: "B" as ShelfId, x: 40, y: 15, width: 20, height: 15, rotation: 0, isCommon: false },
        { id: "C" as ShelfId, x: 70, y: 15, width: 20, height: 15, rotation: 0, isCommon: false },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    await saveWarehouseLayout(defaultLayout)

    console.log("Layout reset to default successfully")
    return NextResponse.json({
      success: true,
      layout: defaultLayout,
      message: "Layout reset to default",
    })
  } catch (error) {
    console.error("Error in DELETE /api/layout:", error)
    return NextResponse.json({ success: false, error: "Failed to reset layout" }, { status: 500 })
  }
}
