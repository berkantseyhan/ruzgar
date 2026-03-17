-- Clean up warehouses to have exactly 2 warehouses with proper layouts

-- First, let's see what we have
-- SELECT COUNT(*) as warehouse_count FROM "Depo_Ruzgar_Warehouses";
-- SELECT COUNT(*) as layout_count FROM "Depo_Ruzgar_Warehouse_Layouts";

-- Delete all existing warehouses and related data to start fresh
DELETE FROM "Depo_Ruzgar_Products";
DELETE FROM "Depo_Ruzgar_Transaction_Logs";
DELETE FROM "Depo_Ruzgar_Warehouse_Layouts";
DELETE FROM "Depo_Ruzgar_Warehouses";

-- Create exactly 2 warehouses
INSERT INTO "Depo_Ruzgar_Warehouses" (id, name, description, color_code, is_active, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Ana Depo', 'Ana depo alanı', '#3B82F6', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'İkinci Depo', 'İkinci depo alanı', '#10B981', true, NOW(), NOW());

-- Create default layouts for both warehouses
INSERT INTO "Depo_Ruzgar_Warehouse_Layouts" (id, warehouse_id, name, shelves, created_at, updated_at)
VALUES 
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Ana Depo Layout',
    '[]'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'İkinci Depo Layout',
    '[]'::jsonb,
    NOW(),
    NOW()
  );

-- Verify the cleanup
SELECT 
  w.name as warehouse_name,
  w.color_code,
  w.is_active,
  l.name as layout_name,
  l.id as layout_id
FROM "Depo_Ruzgar_Warehouses" w
LEFT JOIN "Depo_Ruzgar_Warehouse_Layouts" l ON w.id = l.warehouse_id
ORDER BY w.name;
