-- Clean up invalid UUIDs in warehouse layouts table
-- This script fixes UUIDs that have invalid formats like "uuid-layout"

-- First, let's see what invalid UUIDs we have
DO $$
DECLARE
    invalid_record RECORD;
    new_uuid UUID;
BEGIN
    -- Find and fix invalid UUIDs in Depo_Ruzgar_Warehouse_Layouts
    FOR invalid_record IN 
        SELECT id, warehouse_id 
        FROM "Depo_Ruzgar_Warehouse_Layouts" 
        WHERE id::text LIKE '%-layout'
    LOOP
        -- Generate a new valid UUID
        new_uuid := gen_random_uuid();
        
        -- Update the record with the new UUID
        UPDATE "Depo_Ruzgar_Warehouse_Layouts" 
        SET id = new_uuid 
        WHERE id = invalid_record.id;
        
        RAISE NOTICE 'Updated invalid UUID % to % for warehouse %', 
            invalid_record.id, new_uuid, invalid_record.warehouse_id;
    END LOOP;
    
    -- Also clean up any other potential invalid UUID formats
    FOR invalid_record IN 
        SELECT id, warehouse_id 
        FROM "Depo_Ruzgar_Warehouse_Layouts" 
        WHERE length(id::text) != 36 OR id::text NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
    LOOP
        -- Generate a new valid UUID
        new_uuid := gen_random_uuid();
        
        -- Update the record with the new UUID
        UPDATE "Depo_Ruzgar_Warehouse_Layouts" 
        SET id = new_uuid 
        WHERE id = invalid_record.id;
        
        RAISE NOTICE 'Fixed malformed UUID % to % for warehouse %', 
            invalid_record.id, new_uuid, invalid_record.warehouse_id;
    END LOOP;
    
    RAISE NOTICE 'UUID cleanup completed successfully!';
END $$;

-- Verify the cleanup worked
SELECT 
    COUNT(*) as total_layouts,
    COUNT(CASE WHEN id::text LIKE '%-layout' THEN 1 END) as invalid_layouts_remaining
FROM "Depo_Ruzgar_Warehouse_Layouts";
