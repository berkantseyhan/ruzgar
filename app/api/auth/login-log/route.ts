import { type NextRequest, NextResponse } from "next/server"
import { logUserLogin } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error("Invalid JSON in request body:", jsonError)
      return NextResponse.json({ error: "Geçersiz JSON formatı" }, { status: 400 })
    }

    const { username } = body

    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json({ error: "Geçerli bir kullanıcı adı gereklidir" }, { status: 400 })
    }

    // Get client IP and user agent for logging
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Log the user login
    await logUserLogin(username.trim(), {
      ipAddress: clientIP,
      userAgent: userAgent,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Login log error:", error)
    return NextResponse.json({ error: "Giriş kaydı oluşturulamadı" }, { status: 500 })
  }
}
