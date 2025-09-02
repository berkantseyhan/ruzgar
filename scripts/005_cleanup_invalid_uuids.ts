import { createServerClient } from "../lib/supabase"

async function cleanupInvalidUUIDs() {
  console.log("🔧 Starting UUID cleanup process...")

  try {
    const supabase = createServerClient()

    // Check for invalid UUIDs in warehouse layouts table
    console.log("📊 Checking for invalid UUIDs in warehouse layouts...")

    const { data: layouts, error: selectError } = await supabase.from("Depo_Ruzgar_Warehouse_Layouts").select("*")

    if (selectError) {
      console.error("Error fetching layouts:", selectError)
      return
    }

    console.log(`Found ${layouts?.length || 0} layout records`)

    // Find and fix invalid UUIDs (those ending with -layout)
    const invalidLayouts = layouts?.filter((layout) => layout.id && layout.id.includes("-layout")) || []

    console.log(`Found ${invalidLayouts.length} layouts with invalid UUIDs`)

    for (const layout of invalidLayouts) {
      console.log(`🔧 Fixing invalid UUID: ${layout.id}`)

      // Generate a new valid UUID
      const newUUID = generateUUID()

      // Delete the old record
      const { error: deleteError } = await supabase.from("Depo_Ruzgar_Warehouse_Layouts").delete().eq("id", layout.id)

      if (deleteError) {
        console.error(`Error deleting old layout ${layout.id}:`, deleteError)
        continue
      }

      // Insert with new UUID
      const { error: insertError } = await supabase.from("Depo_Ruzgar_Warehouse_Layouts").insert({
        id: newUUID,
        name: layout.name,
        shelves: layout.shelves,
        warehouse_id: layout.warehouse_id,
      })

      if (insertError) {
        console.error(`Error inserting new layout ${newUUID}:`, insertError)
        continue
      }

      console.log(`✅ Fixed UUID: ${layout.id} -> ${newUUID}`)
    }

    console.log("🎉 UUID cleanup completed successfully!")
  } catch (error) {
    console.error("❌ Error during UUID cleanup:", error)
  }
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Run the cleanup
cleanupInvalidUUIDs()
