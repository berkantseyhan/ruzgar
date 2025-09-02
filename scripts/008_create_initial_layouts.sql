-- Create initial layouts for both warehouses with sample shelf data
-- This script creates one active layout per warehouse with basic shelf configurations

-- First, let's make sure we have the is_active column (in case it doesn't exist)
ALTER TABLE "Depo_Ruzgar_Warehouse_Layouts" 
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT false;

-- Clear any existing layouts
DELETE FROM "Depo_Ruzgar_Warehouse_Layouts";

-- Updated to include sample shelf data instead of empty arrays
-- Insert layouts with sample shelves for each warehouse
INSERT INTO "Depo_Ruzgar_Warehouse_Layouts" (
    id,
    name,
    shelves,
    warehouse_id,
    is_active,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    CASE 
        WHEN w.name = 'Ana Depo' THEN w.name || ' - Ana Layout'
        ELSE w.name || ' - Ana Layout'
    END as name,
    CASE 
        WHEN w.name = 'Ana Depo' THEN 
            '[
                {
                    "id": "shelf-a01",
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
                    "id": "shelf-a02", 
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
                    "id": "shelf-a03",
                    "name": "A-03", 
                    "x": 400,
                    "y": 100,
                    "width": 120,
                    "height": 80,
                    "rotation": 0,
                    "layers": 3,
                    "products": []
                }
            ]'::jsonb
        ELSE 
            '[
                {
                    "id": "shelf-b01",
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
                    "id": "shelf-b02",
                    "name": "B-02", 
                    "x": 300,
                    "y": 150,
                    "width": 120,
                    "height": 80,
                    "rotation": 0,
                    "layers": 5,
                    "products": []
                }
            ]'::jsonb
    END as shelves,
    w.id as warehouse_id,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM "Depo_Ruzgar_Warehouses" w;

-- Verify the data was inserted
SELECT 
    l.name as layout_name,
    w.name as warehouse_name,
    l.is_active,
    jsonb_array_length(l.shelves) as shelf_count,
    l.created_at
FROM "Depo_Ruzgar_Warehouse_Layouts" l
JOIN "Depo_Ruzgar_Warehouses" w ON l.warehouse_id = w.id
ORDER BY w.name;
