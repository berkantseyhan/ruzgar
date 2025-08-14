import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🚫 Testing mock data system...")

    return NextResponse.json({
      status: "success",
      message: "Mock Data System Active",
      mode: "MOCK_DATA_ONLY",
      database: "In-Memory Storage",
      redis: "Disabled",
      timestamp: new Date().toISOString(),
      environment: {
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV,
      },
    })
  } catch (error) {
    console.error("❌ Test error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Test failed",
        error: error instanceof Error ? error.message : String(error),
        mode: "MOCK_DATA_ONLY",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
