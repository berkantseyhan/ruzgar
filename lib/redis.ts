import { Redis } from "@upstash/redis"

// Initialize Redis client using environment variables
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

// Helper function to check if Redis is connected
export async function checkRedisConnection() {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error("Redis connection error:", error)
    return false
  }
}
