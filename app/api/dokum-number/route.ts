import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { lot } = await request.json()

    if (!lot || typeof lot !== "string") {
      return NextResponse.json({ error: "Lot numarası gerekli" }, { status: 400 })
    }

    // Generate dokum number based on lot
    // Format: LOT-YYYYMMDD-XXXX (where XXXX is a random 4-digit number)
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "")
    const randomSuffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0")
    const dokumNo = `${lot}-${today}-${randomSuffix}`

    return NextResponse.json({ dokumNo })
  } catch (error) {
    console.error("[v0] Error generating dokum number:", error)
    return NextResponse.json(
      { error: "Döküm numarası oluşturulamadı" },
      { status: 500 }
    )
  }
}
