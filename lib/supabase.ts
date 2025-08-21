import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (singleton pattern)
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

// Server-side Supabase client - FIXED EXPORT
export const createServerClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Default export for general use
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table names with prefix
export const TABLES = {
  PRODUCTS: "Depo_Ruzgar_Products",
  TRANSACTION_LOGS: "Depo_Ruzgar_Transaction_Logs",
  WAREHOUSE_LAYOUTS: "Depo_Ruzgar_Warehouse_Layouts",
  AUTH_PASSWORDS: "Depo_Ruzgar_Auth_Passwords",
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

// Test database connection
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from(TABLES.PRODUCTS).select("count").limit(1)

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
