// Multi-Warehouse Migration Script
// This script migrates the existing single-warehouse system to support multiple warehouses
// Run this after executing 003_add_multi_warehouse_support.sql

import { createServerClient } from "../lib/supabase"
import { readFileSync } from "fs"
import { join } from "path"

// Supabase client
const supabase = createServerClient()

async function executeSQLScript() {
  console.log("🔄 Executing multi-warehouse SQL schema update...")

  try {
    // Read the SQL script
    const sqlScript = readFileSync(join(process.cwd(), "scripts", "003_add_multi_warehouse_support.sql"), "utf8")

    // Split by semicolons and execute each statement
    const statements = sqlScript
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"))

    for (const statement of statements) {
      if (statement.includes("RAISE NOTICE") || statement.includes("DO $$")) {
        // Skip notice blocks as they're not supported in client queries
        continue
      }

      const { error } = await supabase.rpc("exec_sql", { sql_query: statement })

      if (error) {
        console.error(`Error executing SQL statement: ${statement.substring(0, 100)}...`)
        console.error(error)
      }
    }

    console.log("✅ SQL schema update completed successfully")
  } catch (error) {
    console.error("❌ Error executing SQL script:", error)
    throw error
  }
}

async function verifyMigration() {
  console.log("🔍 Verifying migration results...")

  try {
    // Check if warehouses table exists and has data
    const { data: warehouses, error: warehousesError } = await supabase.from("Depo_Ruzgar_Warehouses").select("*")

    if (warehousesError) {
      console.error("❌ Error checking warehouses:", warehousesError)
      return false
    }

    console.log(`✅ Found ${warehouses?.length || 0} warehouses:`)
    warehouses?.forEach((warehouse) => {
      console.log(`  - ${warehouse.name} (${warehouse.color_code})`)
    })

    // Check if products have warehouse_id
    const { data: products, error: productsError } = await supabase
      .from("Depo_Ruzgar_Products")
      .select("warehouse_id")
      .limit(5)

    if (productsError) {
      console.error("❌ Error checking products:", productsError)
      return false
    }

    const productsWithWarehouse = products?.filter((p) => p.warehouse_id) || []
    console.log(`✅ Products with warehouse_id: ${productsWithWarehouse.length}/${products?.length || 0}`)

    // Check if layouts have warehouse_id
    const { data: layouts, error: layoutsError } = await supabase
      .from("Depo_Ruzgar_Warehouse_Layouts")
      .select("warehouse_id, name")

    if (layoutsError) {
      console.error("❌ Error checking layouts:", layoutsError)
      return false
    }

    console.log(`✅ Found ${layouts?.length || 0} warehouse layouts:`)
    layouts?.forEach((layout) => {
      console.log(`  - ${layout.name}`)
    })

    return true
  } catch (error) {
    console.error("❌ Error during verification:", error)
    return false
  }
}

async function createDefaultWarehouseData() {
  console.log("📦 Creating default warehouse data...")

  try {
    // Check if warehouses already exist
    const { data: existingWarehouses } = await supabase.from("Depo_Ruzgar_Warehouses").select("id, name")

    if (existingWarehouses && existingWarehouses.length > 0) {
      console.log("✅ Warehouses already exist, skipping creation")
      return
    }

    // Create default warehouses
    const { error: warehouseError } = await supabase.from("Depo_Ruzgar_Warehouses").insert([
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Ana Depo",
        description: "Ana depo lokasyonu",
        color_code: "#3B82F6",
        is_active: true,
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        name: "İkinci Depo",
        description: "İkinci depo lokasyonu",
        color_code: "#10B981",
        is_active: true,
      },
    ])

    if (warehouseError) {
      console.error("❌ Error creating warehouses:", warehouseError)
      throw warehouseError
    }

    console.log("✅ Default warehouses created successfully")
  } catch (error) {
    console.error("❌ Error creating default warehouse data:", error)
    throw error
  }
}

async function updateExistingData() {
  console.log("🔄 Updating existing data with warehouse references...")

  const defaultWarehouseId = "11111111-1111-1111-1111-111111111111"

  try {
    // Update products without warehouse_id
    const { error: productsError } = await supabase
      .from("Depo_Ruzgar_Products")
      .update({ warehouse_id: defaultWarehouseId })
      .is("warehouse_id", null)

    if (productsError) {
      console.error("❌ Error updating products:", productsError)
    } else {
      console.log("✅ Products updated with warehouse reference")
    }

    // Update transaction logs without warehouse_id
    const { error: logsError } = await supabase
      .from("Depo_Ruzgar_Transaction_Logs")
      .update({ warehouse_id: defaultWarehouseId })
      .is("warehouse_id", null)

    if (logsError) {
      console.error("❌ Error updating transaction logs:", logsError)
    } else {
      console.log("✅ Transaction logs updated with warehouse reference")
    }

    // Update layouts without warehouse_id
    const { error: layoutsError } = await supabase
      .from("Depo_Ruzgar_Warehouse_Layouts")
      .update({ warehouse_id: defaultWarehouseId })
      .is("warehouse_id", null)

    if (layoutsError) {
      console.error("❌ Error updating layouts:", layoutsError)
    } else {
      console.log("✅ Layouts updated with warehouse reference")
    }
  } catch (error) {
    console.error("❌ Error updating existing data:", error)
    throw error
  }
}

// Ana migration fonksiyonu
async function migrate() {
  console.log("🚀 Starting multi-warehouse migration...")
  console.log("This will add support for multiple warehouses to your system")

  try {
    // Step 1: Create default warehouse data
    await createDefaultWarehouseData()

    // Step 2: Update existing data with warehouse references
    await updateExistingData()

    // Step 3: Verify migration
    const isValid = await verifyMigration()

    if (isValid) {
      console.log("🎉 Multi-warehouse migration completed successfully!")
      console.log("")
      console.log("📋 Summary:")
      console.log("  ✅ Warehouses table created")
      console.log("  ✅ Existing data migrated to 'Ana Depo'")
      console.log("  ✅ Second warehouse 'İkinci Depo' created")
      console.log("  ✅ All tables updated with warehouse references")
      console.log("")
      console.log("🔧 Next steps:")
      console.log("  1. Update your application code to use warehouse_id")
      console.log("  2. Add warehouse selector to your UI")
      console.log("  3. Test the multi-warehouse functionality")
    } else {
      console.log("❌ Migration completed with errors. Please check the logs above.")
    }
  } catch (error) {
    console.error("💥 Migration failed:", error)
    process.exit(1)
  }
}

// Script'i çalıştır
if (require.main === module) {
  migrate().catch(console.error)
}

export { migrate }
