import { NextResponse } from "next/server"
import { testRedisConnection } from "@/lib/redis"

export async function GET() {
  try {
    console.log("Testing Redis connection...")

    // Log environment variables (without revealing values)
    console.log("Environment variables available:")
    console.log("REDIS_URL:", !!process.env.REDIS_URL)
    console.log("KV_URL:", !!process.env.KV_URL)
    console.log("KV_REST_API_URL:", !!process.env.KV_REST_API_URL)
    console.log("KV_REST_API_TOKEN:", !!process.env.KV_REST_API_TOKEN)
    console.log("KV_REST_API_READ_ONLY_TOKEN:", !!process.env.KV_REST_API_READ_ONLY_TOKEN)
    console.log("NODE_ENV:", process.env.NODE_ENV)
    console.log("VERCEL_ENV:", process.env.VERCEL_ENV)

    // Check if REDIS_URL is in the rediss:// format
    let redisUrlFormat = "none"
    if (process.env.REDIS_URL) {
      redisUrlFormat = process.env.REDIS_URL.startsWith("rediss://")
        ? "rediss://"
        : process.env.REDIS_URL.startsWith("https://")
          ? "https://"
          : "unknown"
    }

    const result = await testRedisConnection()

    return NextResponse.json({
      status: result.success ? "success" : "error",
      message: result.message,
      environment: {
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV,
      },
      redis: {
        url_format: redisUrlFormat,
        kv_url_available: !!process.env.KV_URL,
        kv_rest_api_url_available: !!process.env.KV_REST_API_URL,
        token_available: !!(process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN),
      },
      usingMockData: !result.success || process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview",
    })
  } catch (error) {
    console.error("Redis test connection error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Redis connection failed",
        error: error instanceof Error ? error.message : String(error),
        environment: {
          node_env: process.env.NODE_ENV,
          vercel_env: process.env.VERCEL_ENV,
        },
        usingMockData: true,
      },
      { status: 500 },
    )
  }
}
