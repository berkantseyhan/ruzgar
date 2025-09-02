import { createClient as createBrowserClient } from "./supabase/client"
import { createClient as createServerClient } from "./supabase/server"

// Export both client types for different use cases
export { createBrowserClient, createServerClient }

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
