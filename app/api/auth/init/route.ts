import { NextResponse } from "next/server"
import { getStoredPassword, setStoredPassword } from "@/lib/auth-supabase"

export async function GET() {
  try {
    // Check if password exists in Redis
    const password = await getStoredPassword()

    if (!password) {
      // If no password is set, set a default one
      // In production, this should be a secure randomly generated password
      // that is communicated to the admin through a secure channel
      const defaultPassword = "warehouse_" + Math.random().toString(36).substring(2, 10)
      await setStoredPassword(defaultPassword)

      return NextResponse.json({
        success: true,
        message: "Default password initialized",
        password: process.env.NODE_ENV === "development" ? defaultPassword : undefined,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Password already exists in Redis",
    })
  } catch (error) {
    console.error("Failed to initialize password:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to initialize password",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
