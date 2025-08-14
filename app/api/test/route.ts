import { NextResponse } from "next/server"
import { testSupabaseConnection } from "@/lib/database"

export async function GET() {
  try {
    console.log("🔍 Testing system status...")

    const connectionTest = await testSupabaseConnection()

    const response = {
      timestamp: new Date().toISOString(),
      status: connectionTest.success ? "healthy" : "degraded",
      mode: connectionTest.mode,
      database: {
        connected: connectionTest.success,
        message: connectionTest.message,
        tables: connectionTest.tables || [],
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      },
    }

    console.log("✅ System status check completed:", response.status)

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ System status check failed:", error)

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: "error",
        mode: "error",
        database: {
          connected: false,
          message: `System error: ${error instanceof Error ? error.message : String(error)}`,
          tables: [],
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasSupabaseUrl: !!process.env.SUPABASE_URL,
          hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
        },
      },
      { status: 500 },
    )
  }
}
