// Bu script Redis'teki verileri Supabase'e taşımak için kullanılabilir
// Manuel olarak çalıştırılması gerekir

import { Redis } from "@upstash/redis"
import { createServerClient } from "../lib/supabase"

// Redis client (eski veriler için)
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Supabase client
const supabase = createServerClient()

async function migrateProducts() {
  console.log("Starting product migration...")

  const shelves = ["A", "B", "C", "D", "E", "F", "G", "orta alan", "çıkış yolu"]
  const layers = [
    "üst kat",
    "orta kat",
    "alt kat",
    "dayının alanı",
    "cam kenarı",
    "tuvalet önü",
    "merdiven tarafı",
    "a önü",
    "b önü",
    "c önü",
    "mutfak yanı",
    "tezgah yanı",
  ]

  let totalProducts = 0

  for (const shelf of shelves) {
    for (const layer of layers) {
      const key = `${shelf}_${layer.replace(" ", "")}`

      try {
        const products = await redis.get<any[]>(key)

        if (products && products.length > 0) {
          console.log(`Migrating ${products.length} products from ${key}`)

          for (const product of products) {
            const { error } = await supabase.from("products").insert({
              id: product.id,
              urun_adi: product.urunAdi,
              kategori: product.kategori,
              olcu: product.olcu,
              raf_no: product.rafNo,
              katman: product.katman,
              kilogram: product.kilogram,
              notlar: product.notlar,
              created_at: new Date(product.createdAt).toISOString(),
            })

            if (error) {
              console.error(`Error migrating product ${product.id}:`, error)
            } else {
              totalProducts++
            }
          }
        }
      } catch (error) {
        console.error(`Error processing ${key}:`, error)
      }
    }
  }

  console.log(`Migration completed. ${totalProducts} products migrated.`)
}

async function migrateLogs() {
  console.log("Starting logs migration...")

  try {
    const logs = await redis.get<any[]>("transaction_logs")

    if (logs && logs.length > 0) {
      console.log(`Migrating ${logs.length} transaction logs`)

      for (const log of logs) {
        const { error } = await supabase.from("transaction_logs").insert({
          id: log.id,
          timestamp: new Date(log.timestamp).toISOString(),
          action_type: log.actionType,
          raf_no: log.rafNo,
          katman: log.katman,
          urun_adi: log.urunAdi,
          username: log.username,
          changes: log.changes,
          product_details: log.productDetails,
        })

        if (error) {
          console.error(`Error migrating log ${log.id}:`, error)
        }
      }
    }

    console.log("Logs migration completed.")
  } catch (error) {
    console.error("Error migrating logs:", error)
  }
}

async function migrateLayout() {
  console.log("Starting layout migration...")

  try {
    const layout = await redis.get<any>("warehouse_layout")

    if (layout) {
      console.log("Migrating warehouse layout")

      const { error } = await supabase.from("warehouse_layouts").insert({
        id: layout.id || "default",
        name: layout.name,
        shelves: layout.shelves,
        created_at: new Date(layout.createdAt).toISOString(),
        updated_at: new Date(layout.updatedAt).toISOString(),
      })

      if (error) {
        console.error("Error migrating layout:", error)
      } else {
        console.log("Layout migration completed.")
      }
    }
  } catch (error) {
    console.error("Error migrating layout:", error)
  }
}

// Ana migration fonksiyonu
async function migrate() {
  console.log("🚀 Starting Redis to Supabase migration...")

  await migrateProducts()
  await migrateLogs()
  await migrateLayout()

  console.log("✅ Migration completed!")
}

// Script'i çalıştır
if (require.main === module) {
  migrate().catch(console.error)
}
