import { Redis } from "@upstash/redis"

// Initialize Redis client with environment variables
let redis: Redis | null = null

try {
  const url = process.env.KV_REST_API_URL || process.env.REDIS_URL || process.env.KV_URL || ""
  const token = process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN || ""

  if (url && token) {
    redis = new Redis({
      url,
      token,
    })
    console.log("Redis client initialized for auth")
  } else {
    console.log("No Redis configuration found for auth")
    redis = null
  }
} catch (error) {
  console.error("Failed to initialize Redis client for auth:", error)
  redis = null
}

// Key for storing the warehouse password in Redis
const PASSWORD_KEY = "warehouse_auth_password"

// Default fallback password (only used if Redis is unavailable and only in development)
const DEFAULT_DEV_PASSWORD = process.env.NODE_ENV === "development" ? "dev_password" : ""

export async function getStoredPassword(): Promise<string | null> {
  try {
    if (!redis) {
      console.error("Redis client not available for password retrieval")
      return process.env.NODE_ENV === "development" ? DEFAULT_DEV_PASSWORD : null
    }

    const password = await redis.get<string>(PASSWORD_KEY)
    return password
  } catch (error) {
    console.error("Error fetching password from Redis:", error)
    return process.env.NODE_ENV === "development" ? DEFAULT_DEV_PASSWORD : null
  }
}

// Function to set the password in Redis (for admin use)
export async function setStoredPassword(password: string): Promise<boolean> {
  try {
    if (!redis) {
      console.error("Redis client not available for password storage")
      return false
    }

    await redis.set(PASSWORD_KEY, password)
    console.log("Password set in Redis")
    return true
  } catch (error) {
    console.error("Error setting password in Redis:", error)
    return false
  }
}

// Function to verify a password against the stored one
export async function verifyPassword(inputPassword: string): Promise<boolean> {
  try {
    const storedPassword = await getStoredPassword()

    if (!storedPassword) {
      console.error("No password found in Redis")
      return false
    }

    return inputPassword === storedPassword
  } catch (error) {
    console.error("Error verifying password:", error)
    return false
  }
}
