import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.workOrderNo) {
      return NextResponse.json(
        { error: "İş Emri No zorunludur" },
        { status: 400 }
      )
    }

    // Log the work order (in production, save to database)
    console.log("[v0] Work Order Created:", {
      workOrderNo: body.workOrderNo,
      product: body.product,
      productSize: body.productSize,
      customer: body.customer,
      orderNo: body.orderNo,
      notes: body.notes,
      createdAt: body.createdAt,
      signature: body.signature ? "✓ Present" : "✗ Missing",
    })

    // In production, you would save this to your database (Supabase, etc.)
    // For now, we'll just log and return success
    return NextResponse.json(
      {
        success: true,
        message: "İş emri başarıyla kaydedildi",
        workOrderNo: body.workOrderNo,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Work Order Error:", error)
    return NextResponse.json(
      { error: "İş emri kaydedilemedi" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Work Orders API" },
    { status: 200 }
  )
}
