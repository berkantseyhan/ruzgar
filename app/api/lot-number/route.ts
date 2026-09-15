import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // Get a random date within the last 2 weeks (14 days) from today
    const today = new Date()
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
    const randomTime = Math.random() * (today.getTime() - twoWeeksAgo.getTime())
    const randomDate = new Date(twoWeeksAgo.getTime() + randomTime)

    // Format as YYYYMMDD for the date key
    const year = randomDate.getFullYear()
    const month = String(randomDate.getMonth() + 1).padStart(2, "0")
    const day = String(randomDate.getDate()).padStart(2, "0")
    const dateKey = `${year}${month}${day}`

    // Call the atomic Postgres function with the random date key
    const { data, error } = await supabase.rpc("next_lot_seq", { p_date_key: dateKey })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const seq = data as number
    // Zero-pad to 4 digits: 0001, 0012, etc.
    const seqStr = String(seq).padStart(4, "0")
    const lotNo = `${dateKey}-${seqStr}`

    return NextResponse.json({ lotNo })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
