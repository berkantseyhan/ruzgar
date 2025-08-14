import { NextResponse } from "next/server"
import { getTransactionLogs } from "@/lib/database" // Redis yerine database

export async function GET() {
  try {
    const logs = await getTransactionLogs()
    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error fetching transaction logs:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch transaction logs",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
