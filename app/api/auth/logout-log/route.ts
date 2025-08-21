import { type NextRequest, NextResponse } from "next/server"
import { logUserLogout } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { username, loginTime } = await request.json()

    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json({ error: "Geçerli bir kullanıcı adı gereklidir" }, { status: 400 })
    }

    // Get client IP and user agent for logging
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Log the user logout
    await logUserLogout(username.trim(), {
      loginTime: loginTime || undefined,
      ipAddress: clientIP,
      userAgent: userAgent,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout log error:", error)
    return NextResponse.json({ error: "Çıkış kaydı oluşturulamadı" }, { status: 500 })
  }
}
