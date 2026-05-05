import { createClient as createBrowserClient } from "./supabase/client"

// Create and export a singleton Supabase client for client-side usage
export const supabase = createBrowserClient()

// Export browser client for client components
export { createBrowserClient }

// NOTE: Server client should be imported directly from "./supabase/server" 
// in server components/actions only, NOT through this file to avoid 
// bundling server-only code in client bundles

// Database table names with prefix
export const TABLES = {
  PRODUCTS: "Depo_Ruzgar_Products",
  TRANSACTION_LOGS: "Depo_Ruzgar_Transaction_Logs",
  WAREHOUSE_LAYOUTS: "Depo_Ruzgar_Warehouse_Layouts",
  AUTH_PASSWORDS: "Depo_Ruzgar_Auth_Passwords",
  WAREHOUSES: "Depo_Ruzgar_Warehouses",
  TRACEABILITY_LABELS: "Ruzgar_Traceability_Labels",
} as const

export interface TraceabilityLabel {
  id: string
  trace_no: string
  printed_at: string
  copies: number
  fields: Record<string, string>      // { urun_adi, olcu, malzeme, kg, adet, tarih, ... }
  hammadde: string | null
  hammadde_lot: string | null
  hammadde_tedarikci: string | null
  alici: string | null
  alici_siparis_no: string | null
  sevkiyat_tarihi: string | null
  notlar: string | null
  created_by: string | null
  updated_at: string
  created_at: string
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
  warehouse_id: string
  created_at: string
  updated_at: string
}

export interface DepoRuzgarTransactionLog {
  id: string
  action_type: "Ekleme" | "Güncelleme" | "Silme"
  raf_no: string
  katman: string
  urun_adi: string
  username: string
  warehouse_id: string
  changes: any[] | null
  product_details: any | null
  session_info: any | null
  created_at: string
}

export interface DepoRuzgarWarehouseLayout {
  id: string
  name: string
  warehouse_id: string
  shelves: any[]
  created_at: string
  updated_at: string
}

export interface DepoRuzgarWarehouse {
  id: string
  name: string
  description: string
  color_code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DepoRuzgarAuthPassword {
  id: string
  username: string
  password_hash: string
  created_at: string
  updated_at: string
}
