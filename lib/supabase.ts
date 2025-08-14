import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (singleton pattern)
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey)
  }
  return supabaseClient
}

// Server-side Supabase client
export const createServerClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

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
