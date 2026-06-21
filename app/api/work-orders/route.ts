import { createClient } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

interface WorkOrderData {
  product: string
  productSize: string
  customer: string
  orderNo: string
  material: string
  machine: string
  notes: string
}

// Generate work order ID based on date and sequence
async function generateWorkOrderNo(): Promise<string> {
  const supabase = createClient()
  const today = new Date().toISOString().split("T")[0].replace(/-/g, "")
  
  // Get the last sequence number for today
  const { data: lastOrder } = await supabase
    .from("Ruzgar_Work_Orders")
    .select("work_order_no")
    .like("work_order_no", `${today}%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()
  
  let sequence = 1
  if (lastOrder && lastOrder.work_order_no) {
    const lastSeq = parseInt(lastOrder.work_order_no.slice(-3))
    sequence = lastSeq + 1
  }
  
  return `${today}-${String(sequence).padStart(3, "0")}`
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WorkOrderData
    console.log("[v0] Work order POST body:", body)
    
    const supabase = createClient()
    
    // Generate work order ID based on date and sequence
    const workOrderNo = await generateWorkOrderNo()
    console.log("[v0] Generated work order no:", workOrderNo)
    
    // Save to database
    console.log("[v0] Inserting work order with data:", {
      work_order_no: workOrderNo,
      product: body.product,
      product_size: body.productSize,
      customer: body.customer,
      order_no: body.orderNo,
      material: body.material,
      machine: body.machine,
      notes: body.notes,
    })
    
    const { data, error } = await supabase
      .from("Ruzgar_Work_Orders")
      .insert({
        work_order_no: workOrderNo,
        product: body.product,
        product_size: body.productSize,
        customer: body.customer,
        order_no: body.orderNo,
        material: body.material,
        machine: body.machine,
        notes: body.notes,
      })
      .select("*")
    
    if (error) {
      console.error("[v0] Error saving work order:", error)
      console.error("[v0] Error details:", JSON.stringify(error))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log("[v0] Work Order Saved:", data)
    return NextResponse.json({ success: true, workOrder: data, workOrderNo })
  } catch (error) {
    console.error("[v0] Work Order Error:", error)
    return NextResponse.json(
      { error: "İş emri kaydedilemedi" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    
    const { data, error } = await supabase
      .from("Ruzgar_Work_Orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error("[v0] Error fetching work orders:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ workOrders: data })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: "İş emirleri alınamadı" }, { status: 500 })
  }
}
