import { NextResponse } from "next/server"
import { testSupabaseConnection } from "@/lib/database"

export async function GET() {
  try {
    const connectionTest = await testSupabaseConnection()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: connectionTest.success ? "healthy" : "error",
      mode: connectionTest.mode,
      database: {
        connected: connectionTest.success,
        message: connectionTest.message,
        tables: connectionTest.tables || [],
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || "unknown",
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    })
  } catch (error) {
    console.error("API Test Error:", error)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: "error",
      mode: "error",
      database: {
        connected: false,
        message: `Sistem hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
        tables: [],
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || "unknown",
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    })
  }
}
