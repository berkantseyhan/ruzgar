import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const result: any = {}

    // Get different analytics based on the type
    switch (type) {
      case "materials":
        // Get most used materials
        result.materials = await redis.hgetall("stats:materials")
        break

      case "shapes":
        // Get most used shapes
        result.shapes = await redis.hgetall("stats:shapes")
        break

      case "recent":
        // Get recent calculations
        const recentEventIds = await redis.zrange("events:calculations", -limit, -1, { rev: true })
        const recentEvents = []

        for (const eventId of recentEventIds) {
          const event = await redis.hgetall(eventId)
          if (event) {
            recentEvents.push(event)
          }
        }

        result.recent = recentEvents
        break

      case "all":
      default:
        // Get all stats
        result.materials = await redis.hgetall("stats:materials")
        result.shapes = await redis.hgetall("stats:shapes")

        const recentCalcIds = await redis.zrange("events:calculations", -5, -1, { rev: true })
        const recentCalcs = []

        for (const eventId of recentCalcIds) {
          const event = await redis.hgetall(eventId)
          if (event) {
            recentCalcs.push(event)
          }
        }

        result.recent = recentCalcs
        break
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch analytics data" }, { status: 500 })
  }
}
