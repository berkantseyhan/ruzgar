import { createClient as createBrowserClient } from "./supabase/client"
import { createClient as createServerClient } from "./supabase/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

const SUPABASE_AVAILABLE = !!(supabaseUrl && supabaseAnonKey)

if (!SUPABASE_AVAILABLE) {
  console.warn("Supabase not configured - using fallback mode")
}

// Export both client types for different use cases
export { createBrowserClient, createServerClient }

export const supabase = SUPABASE_AVAILABLE ? createBrowserClient() : null

// Client-side Supabase client (singleton pattern)
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getClient = () => {
  if (!SUPABASE_AVAILABLE) {
    console.warn("Supabase not configured - using fallback mode")
    return null
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!)
  }
  return supabaseClient
}

export const isSupabaseAvailable = () => SUPABASE_AVAILABLE

// Database table names with prefix
export const TABLES = {
  PRODUCTS: "Depo_Ruzgar_Products",
  TRANSACTION_LOGS: "Depo_Ruzgar_Transaction_Logs",
  WAREHOUSE_LAYOUTS: "Depo_Ruzgar_Warehouse_Layouts",
  AUTH_PASSWORDS: "Depo_Ruzgar_Auth_Passwords",
  WAREHOUSES: "Depo_Ruzgar_Warehouses",
} as const

// Database types for Depo_Ruzgar tables
export interface DepoRuzgarProduct {
  id: string
  urun_adi: string
  kategori: string
  olcu: string
  raf_no: string
  katman: string
  kilogram: number
  notlar: string
  created_at: string
  updated_at: string
}

export interface DepoRuzgarTransactionLog {
  id: string
  timestamp: string
  action_type: "Ekleme" | "Güncelleme" | "Silme"
  raf_no: string
  katman: string
  urun_adi: string
  username: string
  changes: any[] | null
  product_details: any | null
  created_at: string
}

export interface DepoRuzgarWarehouseLayout {
  id: string
  name: string
  shelves: any[]
  created_at: string
  updated_at: string
}

export interface DepoRuzgarAuthPassword {
  id: string
  password_hash: string
  created_at: string
  updated_at: string
}

export async function testSupabaseConnection(): Promise<boolean> {
  if (!SUPABASE_AVAILABLE) {
    console.log("Supabase not configured - running in fallback mode")
    return false
  }

  try {
    const client = getClient()
    if (!client) return false

    const { data, error } = await client.from(TABLES.PRODUCTS).select("count").limit(1)

    if (error) {
      console.log("Supabase connection test failed:", error.message)
      return false
    }

    console.log("Supabase connection successful")
    return true
  } catch (error) {
    console.log("Supabase connection error:", error)
    return false
  }
}

export const fallbackStorage = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(`depo_ruzgar_${key}`)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },

  set: (key: string, value: any) => {
    try {
      localStorage.setItem(`depo_ruzgar_${key}`, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },

  remove: (key: string) => {
    try {
      localStorage.removeItem(`depo_ruzgar_${key}`)
      return true
    } catch {
      return false
    }
  },
}
