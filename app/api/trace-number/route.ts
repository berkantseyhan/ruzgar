import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // Get today's date key in Turkey timezone (UTC+3)
    const now = new Date()
    const tr = new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now)

    const year  = tr.find((p) => p.type === "year")!.value
    const month = tr.find((p) => p.type === "month")!.value
    const day   = tr.find((p) => p.type === "day")!.value
    const dateKey = `${year}${month}${day}` // e.g. "20260507"

    // Call the atomic Postgres function
    const { data, error } = await supabase
      .rpc("next_trace_seq", { p_date_key: dateKey })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const seq = data as number
    // Zero-pad to 6 digits: 000001, 000012, etc.
    const seqStr = String(seq).padStart(6, "0")
    const traceNo = `RC-${dateKey}-${seqStr}`

    return NextResponse.json({ traceNo })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
