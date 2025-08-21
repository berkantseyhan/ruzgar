import { type NextRequest, NextResponse } from "next/server"
import { initializePassword, getStoredPassword } from "@/lib/auth-supabase"

export async function GET() {
  try {
    const storedPassword = await getStoredPassword()
    return NextResponse.json({
      initialized: !!storedPassword,
      message: storedPassword ? "Password system is initialized" : "Password system needs initialization",
    })
  } catch (error) {
    console.error("Error checking initialization status:", error)
    return NextResponse.json(
      {
        initialized: false,
        message: "Error checking initialization status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const success = await initializePassword()

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Password system initialized successfully",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to initialize password system",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error initializing password:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error initializing password system",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
