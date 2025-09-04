-- Rename warehouses from Ana Depo/İkinci Depo to Dış Depo/İç Depo
-- This script updates the warehouse names in the database

-- Update warehouse names
UPDATE "Depo_Ruzgar_Warehouses" 
SET 
    name = 'Dış Depo',
    description = 'Dış depo - mavi renk kodlu',
    updated_at = NOW()
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE "Depo_Ruzgar_Warehouses" 
SET 
    name = 'İç Depo',
    description = 'İç depo - yeşil renk kodlu',
    updated_at = NOW()
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Update layout names to match new warehouse names
UPDATE "Depo_Ruzgar_Warehouse_Layouts" 
SET 
    name = 'Dış Depo - Ana Layout',
    updated_at = NOW()
WHERE warehouse_id = '11111111-1111-1111-1111-111111111111';

UPDATE "Depo_Ruzgar_Warehouse_Layouts" 
SET 
    name = 'İç Depo - Ana Layout',
    updated_at = NOW()
WHERE warehouse_id = '22222222-2222-2222-2222-222222222222';

-- Verify the changes
SELECT 
    id,
    name,
    description,
    color_code,
    is_active
FROM "Depo_Ruzgar_Warehouses"
ORDER BY name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Warehouse names updated successfully!';
    RAISE NOTICE 'Ana Depo → Dış Depo';
    RAISE NOTICE 'İkinci Depo → İç Depo';
END $$;
