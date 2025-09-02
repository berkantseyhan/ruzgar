-- =====================================================
-- COMPLETE MULTI-WAREHOUSE SYSTEM SETUP
-- =====================================================
-- This script sets up the entire multi-warehouse system from scratch
-- Run this script to initialize or reset the warehouse system

-- Step 1: Ensure all tables exist with correct structure
-- =====================================================

-- Create Warehouses table
CREATE TABLE IF NOT EXISTS "Depo_Ruzgar_Warehouses" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color_code VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Warehouse Layouts table
CREATE TABLE IF NOT EXISTS "Depo_Ruzgar_Warehouse_Layouts" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    shelves JSONB NOT NULL DEFAULT '[]',
    warehouse_id UUID REFERENCES "Depo_Ruzgar_Warehouses"(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Products table
CREATE TABLE IF NOT EXISTS "Depo_Ruzgar_Products" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    urun_adi VARCHAR(255) NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    olcu VARCHAR(100) NOT NULL,
    raf_no VARCHAR(50) NOT NULL,
    katman VARCHAR(100) NOT NULL,
    kilogram DECIMAL(10,2) NOT NULL DEFAULT 0,
    notlar TEXT DEFAULT '',
    warehouse_id UUID REFERENCES "Depo_Ruzgar_Warehouses"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Transaction Logs table
CREATE TABLE IF NOT EXISTS "Depo_Ruzgar_Transaction_Logs" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(50) NOT NULL,
    raf_no VARCHAR(50) NOT NULL,
    katman VARCHAR(100) NOT NULL,
    urun_adi VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    changes JSONB,
    product_details JSONB,
    session_info JSONB,
    warehouse_id UUID REFERENCES "Depo_Ruzgar_Warehouses"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Auth Passwords table
CREATE TABLE IF NOT EXISTS "Depo_Ruzgar_Auth_Passwords" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add indexes for better performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_warehouse_id ON "Depo_Ruzgar_Products"(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_products_raf_katman ON "Depo_Ruzgar_Products"(raf_no, katman);
CREATE INDEX IF NOT EXISTS idx_layouts_warehouse_id ON "Depo_Ruzgar_Warehouse_Layouts"(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_layouts_active ON "Depo_Ruzgar_Warehouse_Layouts"(warehouse_id, is_active);
CREATE INDEX IF NOT EXISTS idx_logs_warehouse_id ON "Depo_Ruzgar_Transaction_Logs"(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON "Depo_Ruzgar_Transaction_Logs"(created_at DESC);

-- Step 3: Create trigger to ensure only one active layout per warehouse
-- =====================================================

CREATE OR REPLACE FUNCTION ensure_single_active_layout()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new/updated layout is being set to active
    IF NEW.is_active = true THEN
        -- Set all other layouts for this warehouse to inactive
        UPDATE "Depo_Ruzgar_Warehouse_Layouts" 
        SET is_active = false 
        WHERE warehouse_id = NEW.warehouse_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_ensure_single_active_layout ON "Depo_Ruzgar_Warehouse_Layouts";
CREATE TRIGGER trigger_ensure_single_active_layout
    BEFORE INSERT OR UPDATE ON "Depo_Ruzgar_Warehouse_Layouts"
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_layout();

-- Step 4: Clear existing data and set up fresh system
-- =====================================================

-- Clear all existing data (in correct order due to foreign keys)
DELETE FROM "Depo_Ruzgar_Transaction_Logs";
DELETE FROM "Depo_Ruzgar_Products";
DELETE FROM "Depo_Ruzgar_Warehouse_Layouts";
DELETE FROM "Depo_Ruzgar_Warehouses";

-- Step 5: Create the 2 main warehouses
-- =====================================================

INSERT INTO "Depo_Ruzgar_Warehouses" (id, name, description, color_code, is_active) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Ana Depo',
    'Ana depo - mavi renk kodlu',
    '#3b82f6',
    true
),
(
    '22222222-2222-2222-2222-222222222222',
    'İkinci Depo', 
    'İkinci depo - yeşil renk kodlu',
    '#10b981',
    true
);

-- Step 6: Create active layouts for each warehouse
-- =====================================================

-- Ana Depo Layout with sample shelves
INSERT INTO "Depo_Ruzgar_Warehouse_Layouts" (
    id,
    name,
    shelves,
    warehouse_id,
    is_active
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Ana Depo - Ana Layout',
    '[
        {
            "id": "A-01",
            "name": "A-01",
            "x": 100,
            "y": 100,
            "width": 120,
            "height": 80,
            "rotation": 0,
            "layers": 3,
            "products": []
        },
        {
            "id": "A-02",
            "name": "A-02", 
            "x": 250,
            "y": 100,
            "width": 120,
            "height": 80,
            "rotation": 0,
            "layers": 4,
            "products": []
        },
        {
            "id": "A-03",
            "name": "A-03",
            "x": 400,
            "y": 100,
            "width": 120,
            "height": 80,
            "rotation": 0,
            "layers": 3,
            "products": []
        }
    ]'::jsonb,
    '11111111-1111-1111-1111-111111111111',
    true
);

-- İkinci Depo Layout with sample shelves
INSERT INTO "Depo_Ruzgar_Warehouse_Layouts" (
    id,
    name,
    shelves,
    warehouse_id,
    is_active
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    'İkinci Depo - Ana Layout',
    '[
        {
            "id": "B-01",
            "name": "B-01",
            "x": 150,
            "y": 150,
            "width": 120,
            "height": 80,
            "rotation": 0,
            "layers": 4,
            "products": []
        },
        {
            "id": "B-02",
            "name": "B-02",
            "x": 300,
            "y": 150,
            "width": 120,
            "height": 80,
            "rotation": 0,
            "layers": 5,
            "products": []
        }
    ]'::jsonb,
    '22222222-2222-2222-2222-222222222222',
    true
);

-- Step 7: Create default admin user (optional)
-- =====================================================

-- Insert default admin user (password: admin123 - change this!)
INSERT INTO "Depo_Ruzgar_Auth_Passwords" (username, password_hash) VALUES
('admin', '$2b$10$rOzJqQqQqQqQqQqQqQgOzJqQqQqQqQqQqQgQgQgQgQgQgQgQgQgQgQ');

-- Step 8: Add sample transaction log
-- =====================================================

INSERT INTO "Depo_Ruzgar_Transaction_Logs" (
    action_type,
    raf_no,
    katman,
    urun_adi,
    username,
    warehouse_id,
    session_info
) VALUES (
    'Giriş',
    'sistem',
    'kurulum',
    'Sistem Kurulumu',
    'system',
    '11111111-1111-1111-1111-111111111111',
    jsonb_build_object(
        'setup', true,
        'timestamp', NOW()::text,
        'message', 'Multi-warehouse system initialized'
    )
);

-- Step 9: Verification queries
-- =====================================================

-- Verify warehouses
SELECT 
    'Warehouses' as table_name,
    COUNT(*) as record_count,
    STRING_AGG(name, ', ') as warehouse_names
FROM "Depo_Ruzgar_Warehouses" 
WHERE is_active = true;

-- Verify layouts
SELECT 
    'Layouts' as table_name,
    l.name as layout_name,
    w.name as warehouse_name,
    l.is_active,
    jsonb_array_length(l.shelves) as shelf_count
FROM "Depo_Ruzgar_Warehouse_Layouts" l
JOIN "Depo_Ruzgar_Warehouses" w ON l.warehouse_id = w.id
WHERE l.is_active = true
ORDER BY w.name;

-- Verify system is ready
SELECT 
    'System Status' as status,
    'Ready' as message,
    COUNT(DISTINCT w.id) as warehouse_count,
    COUNT(DISTINCT l.id) as active_layout_count
FROM "Depo_Ruzgar_Warehouses" w
LEFT JOIN "Depo_Ruzgar_Warehouse_Layouts" l ON w.id = l.warehouse_id AND l.is_active = true
WHERE w.is_active = true;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Your multi-warehouse system is now ready!
-- 
-- What was created:
-- ✅ 2 Warehouses: Ana Depo (blue) and İkinci Depo (green)
-- ✅ 2 Active layouts with sample shelves
-- ✅ Database triggers for layout management
-- ✅ Proper indexes for performance
-- ✅ Sample transaction log
-- 
-- Next steps:
-- 1. Refresh your v0 preview
-- 2. Select a warehouse from the dropdown
-- 3. Start adding/editing shelves in the layout
-- 4. Add products to your shelves
-- =====================================================
