import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // Use a single global counter so lot numbers are a continuous sequence
    const { data, error } = await supabase
      .rpc("next_lot_seq", { p_date_key: "global" })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const seq = data as number
    // Zero-pad to 6 digits: 000001, 000012, etc.
    const lotNo = String(seq).padStart(6, "0")

    return NextResponse.json({ lotNo })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
