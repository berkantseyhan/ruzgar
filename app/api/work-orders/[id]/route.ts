import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase configuration missing for admin client")
  }

  return createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 })
    }

    const supabase = getAdminClient()

    const { error } = await supabase
      .from("Ruzgar_Work_Orders")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[v0] Error deleting work order:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "İş emri silindi" })
  } catch (error) {
    console.error("[v0] Delete Error:", error)
    return NextResponse.json({ error: "İş emri silinemedi" }, { status: 500 })
  }
}
