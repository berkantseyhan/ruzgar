import { NextResponse } from "next/server"
import { testSupabaseConnection } from "@/lib/database"

export async function GET() {
  try {
    console.log("Testing Supabase connection...")

    const result = await testSupabaseConnection()

    return NextResponse.json({
      status: result.success ? "success" : "error",
      message: "Depo Ruzgar System - Supabase Connected",
      connection: result,
      mode: "SUPABASE_PRODUCTION",
      database: "Supabase PostgreSQL",
      tables: [
        "Depo_Ruzgar_Products",
        "Depo_Ruzgar_Transaction_Logs",
        "Depo_Ruzgar_Warehouse_Layouts",
        "Depo_Ruzgar_Auth_Passwords",
      ],
      timestamp: new Date().toISOString(),
      environment: {
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV,
      },
    })
  } catch (error) {
    console.error("Test error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Supabase connection test failed",
        error: error instanceof Error ? error.message : String(error),
        mode: "SUPABASE_PRODUCTION",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
