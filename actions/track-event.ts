"use server"

import { redis } from "@/lib/redis"
import { cookies } from "next/headers"

type EventType =
  | "material_selected"
  | "shape_selected"
  | "dimension_changed"
  | "price_changed"
  | "quantity_changed"
  | "calculation_performed"

type EventData = {
  materialType?: string
  materialDensity?: number
  shapeType?: string
  dimensions?: Record<string, number>
  price?: number
  quantity?: number
  weight?: number
  cost?: number
  timestamp: number
  sessionId: string
}

export async function trackEvent(type: EventType, data: Omit<EventData, "timestamp">) {
  try {
    const timestamp = Date.now()
    const eventId = `event:${timestamp}:${Math.random().toString(36).substring(2, 10)}`

    // Add timestamp to the event data
    const eventData: EventData = {
      ...data,
      timestamp,
    }

    // Store the event in Redis
    await redis.hset(eventId, eventData)

    // Add to a time-series list for easier querying
    await redis.zadd("events:timeline", { score: timestamp, member: eventId })

    // Add to event type specific list
    await redis.zadd(`events:${type}`, { score: timestamp, member: eventId })

    // If it's a calculation event, store in a separate list for analytics
    if (type === "calculation_performed") {
      await redis.zadd("events:calculations", { score: timestamp, member: eventId })

      // Increment counter for the material type
      if (data.materialType) {
        await redis.hincrby("stats:materials", data.materialType, 1)
      }

      // Increment counter for the shape type
      if (data.shapeType) {
        await redis.hincrby("stats:shapes", data.shapeType, 1)
      }
    }

    return { success: true, eventId }
  } catch (error) {
    console.error("Failed to track event:", error)
    return { success: false, error: "Failed to track event" }
  }
}

// Completely rewritten to be a proper server action
export async function getSessionId() {
  // Server-side session ID management using cookies
  const cookieStore = cookies()
  let sessionId = cookieStore.get("ruzgar_session_id")?.value

  if (!sessionId) {
    // Generate a new session ID if one doesn't exist
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`

    // Set the cookie with a 30-day expiration
    cookieStore.set("ruzgar_session_id", sessionId, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    })
  }

  return sessionId
}

// New function to generate a client-side session ID
export async function getClientSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}
