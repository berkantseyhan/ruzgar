import { NextResponse } from "next/server"
import { getTransactionLogs } from "@/lib/database"

export async function GET() {
  try {
    const logs = await getTransactionLogs()
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
