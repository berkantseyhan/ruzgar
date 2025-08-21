import { type NextRequest, NextResponse } from "next/server"
import { verifyPassword } from "@/lib/auth-supabase"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ success: false, message: "Password is required" }, { status: 400 })
    }

    console.log("Verifying password for login attempt...")
    const isValid = await verifyPassword(password)

    if (isValid) {
      console.log("Password verification successful")
      return NextResponse.json({
        success: true,
        message: "Authentication successful",
      })
    } else {
      console.log("Password verification failed")
      return NextResponse.json({ success: false, message: "Invalid password" }, { status: 401 })
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Authentication failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
