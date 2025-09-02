import { NextResponse } from "next/server"
import { getWarehouses, createWarehouse } from "@/lib/database"
import { isSupabaseAvailable } from "@/lib/supabase"
import type { Warehouse } from "@/lib/database"

export async function GET() {
  try {
    console.log("GET /api/warehouses - Fetching all warehouses...")

    if (!isSupabaseAvailable()) {
      console.log("⚠️ Supabase not available - using fallback mode")
      return NextResponse.json(
        {
          success: false,
          error: "Veritabanı bağlantısı mevcut değil",
          details: "Supabase integration is not configured. Please check your Project Settings.",
          fallback: true,
        },
        { status: 503 },
      )
    }

    const warehouses = await getWarehouses()

    console.log(`✅ Found ${warehouses.length} warehouses`)
    return NextResponse.json({
      success: true,
      warehouses,
      message: "Warehouses fetched successfully",
    })
  } catch (error) {
    console.error("Error fetching warehouses:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Depolar yüklenirken hata oluştu",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/warehouses - Creating new warehouse...")

    if (!isSupabaseAvailable()) {
      console.log("⚠️ Supabase not available - cannot create warehouse")
      return NextResponse.json(
        {
          success: false,
          error: "Veritabanı bağlantısı mevcut değil",
          details: "Supabase integration is not configured. Please check your Project Settings.",
          fallback: true,
        },
        { status: 503 },
      )
    }

    const body = await request.json()
    const { name, description, color_code } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Depo adı gereklidir" }, { status: 400 })
    }

    const warehouseData: Omit<Warehouse, "id" | "created_at" | "updated_at"> = {
      name: name.trim(),
      description: description?.trim() || "",
      color_code: color_code || "#3B82F6",
      is_active: true,
    }

    const success = await createWarehouse(warehouseData)

    if (success) {
      console.log(`✅ Warehouse created: ${name}`)
      return NextResponse.json({
        success: true,
        message: "Depo başarıyla oluşturuldu",
      })
    } else {
      return NextResponse.json({ success: false, error: "Depo oluşturulamadı" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error creating warehouse:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Depo oluşturulurken hata oluştu",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
