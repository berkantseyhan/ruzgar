-- Depo Rüzgar Warehouse Management System - Database Schema
-- This script creates all necessary tables for the warehouse management system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Products table
CREATE TABLE IF NOT EXISTS public."Depo_Ruzgar_Products" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    urun_adi VARCHAR(255) NOT NULL,
    kategori VARCHAR(100),
    olcu VARCHAR(100),
    raf_no VARCHAR(50) NOT NULL,
    katman VARCHAR(50) NOT NULL,
    kilogram DECIMAL(10,3) CHECK (kilogram >= 0 AND kilogram <= 999999.999),
    notlar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Transaction Logs table
CREATE TABLE IF NOT EXISTS public."Depo_Ruzgar_Transaction_Logs" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type VARCHAR(50) NOT NULL,
    raf_no VARCHAR(50),
    katman VARCHAR(50),
    urun_adi VARCHAR(255),
    username VARCHAR(100),
    changes JSONB DEFAULT '[]'::jsonb,
    product_details JSONB DEFAULT '{}'::jsonb,
    session_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Warehouse Layouts table
CREATE TABLE IF NOT EXISTS public."Depo_Ruzgar_Warehouse_Layouts" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    shelves JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Auth Passwords table
CREATE TABLE IF NOT EXISTS public."Depo_Ruzgar_Auth_Passwords" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_raf_katman ON public."Depo_Ruzgar_Products"(raf_no, katman);
CREATE INDEX IF NOT EXISTS idx_products_urun_adi ON public."Depo_Ruzgar_Products"(urun_adi);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_created_at ON public."Depo_Ruzgar_Transaction_Logs"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_username ON public."Depo_Ruzgar_Transaction_Logs"(username);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_action_type ON public."Depo_Ruzgar_Transaction_Logs"(action_type);

-- Insert default admin password record
-- Password: "password" -> bcrypt hash
INSERT INTO public."Depo_Ruzgar_Auth_Passwords" (id, username, password_hash, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- "password"
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert default warehouse layout
INSERT INTO public."Depo_Ruzgar_Warehouse_Layouts" (id, name, shelves, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Varsayılan Layout',
    '[
        {"id": "E", "x": 5, "y": 5, "width": 25, "height": 15, "rotation": 0},
        {"id": "çıkış yolu", "x": 35, "y": 5, "width": 30, "height": 35, "rotation": 0, "isCommon": true},
        {"id": "G", "x": 70, "y": 5, "width": 25, "height": 15, "rotation": 0},
        {"id": "D", "x": 5, "y": 25, "width": 25, "height": 15, "rotation": 0},
        {"id": "F", "x": 70, "y": 25, "width": 25, "height": 15, "rotation": 0},
        {"id": "B", "x": 20, "y": 45, "width": 20, "height": 15, "rotation": 0},
        {"id": "C", "x": 45, "y": 45, "width": 20, "height": 15, "rotation": 0},
        {"id": "A", "x": 5, "y": 55, "width": 10, "height": 40, "rotation": 0},
        {"id": "orta alan", "x": 20, "y": 75, "width": 75, "height": 20, "rotation": 0, "isCommon": true}
    ]'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public."Depo_Ruzgar_Products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Depo_Ruzgar_Transaction_Logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Depo_Ruzgar_Warehouse_Layouts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Depo_Ruzgar_Auth_Passwords" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on products" ON public."Depo_Ruzgar_Products";
DROP POLICY IF EXISTS "Allow all operations on transaction_logs" ON public."Depo_Ruzgar_Transaction_Logs";
DROP POLICY IF EXISTS "Allow all operations on warehouse_layouts" ON public."Depo_Ruzgar_Warehouse_Layouts";
DROP POLICY IF EXISTS "Allow all operations on auth_passwords" ON public."Depo_Ruzgar_Auth_Passwords";

-- Create policies to allow all operations (since we handle auth at app level)
CREATE POLICY "Allow all operations on products" ON public."Depo_Ruzgar_Products" FOR ALL USING (true);
CREATE POLICY "Allow all operations on transaction_logs" ON public."Depo_Ruzgar_Transaction_Logs" FOR ALL USING (true);
CREATE POLICY "Allow all operations on warehouse_layouts" ON public."Depo_Ruzgar_Warehouse_Layouts" FOR ALL USING (true);
CREATE POLICY "Allow all operations on auth_passwords" ON public."Depo_Ruzgar_Auth_Passwords" FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_depo_ruzgar_products_updated_at ON public."Depo_Ruzgar_Products";
CREATE TRIGGER update_depo_ruzgar_products_updated_at
    BEFORE UPDATE ON public."Depo_Ruzgar_Products"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_depo_ruzgar_warehouse_layouts_updated_at ON public."Depo_Ruzgar_Warehouse_Layouts";
CREATE TRIGGER update_depo_ruzgar_warehouse_layouts_updated_at
    BEFORE UPDATE ON public."Depo_Ruzgar_Warehouse_Layouts"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_depo_ruzgar_auth_passwords_updated_at ON public."Depo_Ruzgar_Auth_Passwords";
CREATE TRIGGER update_depo_ruzgar_auth_passwords_updated_at
    BEFORE UPDATE ON public."Depo_Ruzgar_Auth_Passwords"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Depo Rüzgar database schema created successfully!';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - Depo_Ruzgar_Products';
    RAISE NOTICE '  - Depo_Ruzgar_Transaction_Logs';
    RAISE NOTICE '  - Depo_Ruzgar_Warehouse_Layouts';
    RAISE NOTICE '  - Depo_Ruzgar_Auth_Passwords';
    RAISE NOTICE '';
    RAISE NOTICE 'Default admin password: "password"';
    RAISE NOTICE 'Default warehouse layout created with UUID: 00000000-0000-0000-0000-000000000002';
    RAISE NOTICE 'Run the seed script (002_seed_depo_ruzgar_data.sql) to add sample data.';
END $$;
