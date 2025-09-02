import { type NextRequest, NextResponse } from "next/server"
import { getTransactionLogs } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get("warehouseId") || undefined

    console.log(`GET /api/logs - Fetching logs for warehouse: ${warehouseId || "all"}`)

    const logs = await getTransactionLogs(warehouseId)

    console.log(`✅ Found ${logs.length} logs for warehouse ${warehouseId || "all"}`)
    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error fetching transaction logs:", error)
    return NextResponse.json(
      {
        error: "İşlem geçmişi yüklenirken hata oluştu",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
