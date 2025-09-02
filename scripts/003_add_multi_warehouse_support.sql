-- Multi-Warehouse Support - Database Schema Update
-- This script adds support for multiple warehouses to the existing system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Warehouses table
CREATE TABLE IF NOT EXISTS public."Depo_Ruzgar_Warehouses" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color_code VARCHAR(7) DEFAULT '#3B82F6', -- Default blue color
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add warehouse_id to existing tables
ALTER TABLE public."Depo_Ruzgar_Products" 
ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES public."Depo_Ruzgar_Warehouses"(id) ON DELETE CASCADE;

ALTER TABLE public."Depo_Ruzgar_Transaction_Logs" 
ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES public."Depo_Ruzgar_Warehouses"(id) ON DELETE CASCADE;

ALTER TABLE public."Depo_Ruzgar_Warehouse_Layouts" 
ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES public."Depo_Ruzgar_Warehouses"(id) ON DELETE CASCADE;

-- Create indexes for warehouse_id columns
CREATE INDEX IF NOT EXISTS idx_products_warehouse_id ON public."Depo_Ruzgar_Products"(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_warehouse_id ON public."Depo_Ruzgar_Transaction_Logs"(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_layouts_warehouse_id ON public."Depo_Ruzgar_Warehouse_Layouts"(warehouse_id);

-- Create index for warehouse name
CREATE INDEX IF NOT EXISTS idx_warehouses_name ON public."Depo_Ruzgar_Warehouses"(name);

-- Insert default warehouses
INSERT INTO public."Depo_Ruzgar_Warehouses" (id, name, description, color_code, is_active, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Ana Depo', 'Ana depo lokasyonu', '#3B82F6', true, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'İkinci Depo', 'İkinci depo lokasyonu', '#10B981', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update existing data to belong to "Ana Depo" (first warehouse)
UPDATE public."Depo_Ruzgar_Products" 
SET warehouse_id = '11111111-1111-1111-1111-111111111111' 
WHERE warehouse_id IS NULL;

UPDATE public."Depo_Ruzgar_Transaction_Logs" 
SET warehouse_id = '11111111-1111-1111-1111-111111111111' 
WHERE warehouse_id IS NULL;

UPDATE public."Depo_Ruzgar_Warehouse_Layouts" 
SET warehouse_id = '11111111-1111-1111-1111-111111111111' 
WHERE warehouse_id IS NULL;

-- Make warehouse_id NOT NULL after updating existing data
ALTER TABLE public."Depo_Ruzgar_Products" 
ALTER COLUMN warehouse_id SET NOT NULL;

ALTER TABLE public."Depo_Ruzgar_Transaction_Logs" 
ALTER COLUMN warehouse_id SET NOT NULL;

ALTER TABLE public."Depo_Ruzgar_Warehouse_Layouts" 
ALTER COLUMN warehouse_id SET NOT NULL;

-- Enable Row Level Security on Warehouses table
ALTER TABLE public."Depo_Ruzgar_Warehouses" ENABLE ROW LEVEL SECURITY;

-- Create policy for warehouses table
DROP POLICY IF EXISTS "Allow all operations on warehouses" ON public."Depo_Ruzgar_Warehouses";
CREATE POLICY "Allow all operations on warehouses" ON public."Depo_Ruzgar_Warehouses" FOR ALL USING (true);

-- Create trigger for updated_at on warehouses
DROP TRIGGER IF EXISTS update_depo_ruzgar_warehouses_updated_at ON public."Depo_Ruzgar_Warehouses";
CREATE TRIGGER update_depo_ruzgar_warehouses_updated_at
    BEFORE UPDATE ON public."Depo_Ruzgar_Warehouses"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create default layout for second warehouse
INSERT INTO public."Depo_Ruzgar_Warehouse_Layouts" (id, warehouse_id, name, shelves, created_at, updated_at)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'İkinci Depo Layout',
    '[
        {"id": "A1", "x": 10, "y": 10, "width": 20, "height": 15, "rotation": 0},
        {"id": "B1", "x": 35, "y": 10, "width": 20, "height": 15, "rotation": 0},
        {"id": "C1", "x": 60, "y": 10, "width": 20, "height": 15, "rotation": 0},
        {"id": "koridor", "x": 10, "y": 30, "width": 70, "height": 10, "rotation": 0, "isCommon": true},
        {"id": "A2", "x": 10, "y": 45, "width": 20, "height": 15, "rotation": 0},
        {"id": "B2", "x": 35, "y": 45, "width": 20, "height": 15, "rotation": 0},
        {"id": "C2", "x": 60, "y": 45, "width": 20, "height": 15, "rotation": 0}
    ]'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Multi-warehouse support added successfully!';
    RAISE NOTICE 'New table created:';
    RAISE NOTICE '  - Depo_Ruzgar_Warehouses';
    RAISE NOTICE '';
    RAISE NOTICE 'Updated existing tables with warehouse_id:';
    RAISE NOTICE '  - Depo_Ruzgar_Products';
    RAISE NOTICE '  - Depo_Ruzgar_Transaction_Logs';
    RAISE NOTICE '  - Depo_Ruzgar_Warehouse_Layouts';
    RAISE NOTICE '';
    RAISE NOTICE 'Default warehouses created:';
    RAISE NOTICE '  - Ana Depo (Blue)';
    RAISE NOTICE '  - İkinci Depo (Green)';
    RAISE NOTICE '';
    RAISE NOTICE 'All existing data has been assigned to "Ana Depo"';
END $$;
