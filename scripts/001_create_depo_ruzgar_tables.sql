-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Depo_Ruzgar_Products table
CREATE TABLE IF NOT EXISTS Depo_Ruzgar_Products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  urun_adi VARCHAR(255) NOT NULL,
  kategori VARCHAR(100) NOT NULL,
  olcu VARCHAR(100) NOT NULL,
  raf_no VARCHAR(50) NOT NULL,
  katman VARCHAR(100) NOT NULL,
  kilogram DECIMAL(10,2) NOT NULL DEFAULT 0,
  notlar TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Depo_Ruzgar_Transaction_Logs table
CREATE TABLE IF NOT EXISTS Depo_Ruzgar_Transaction_Logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('Ekleme', 'Güncelleme', 'Silme')),
  raf_no VARCHAR(50) NOT NULL,
  katman VARCHAR(100) NOT NULL,
  urun_adi VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL DEFAULT 'Bilinmeyen Kullanıcı',
  changes JSONB,
  product_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Depo_Ruzgar_Warehouse_Layouts table
CREATE TABLE IF NOT EXISTS Depo_Ruzgar_Warehouse_Layouts (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  name VARCHAR(255) NOT NULL,
  shelves JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Depo_Ruzgar_Auth_Passwords table
CREATE TABLE IF NOT EXISTS Depo_Ruzgar_Auth_Passwords (
  id VARCHAR(20) PRIMARY KEY DEFAULT 'main',
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_depo_ruzgar_products_raf_katman ON Depo_Ruzgar_Products(raf_no, katman);
CREATE INDEX IF NOT EXISTS idx_depo_ruzgar_products_created_at ON Depo_Ruzgar_Products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_depo_ruzgar_transaction_logs_timestamp ON Depo_Ruzgar_Transaction_Logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_depo_ruzgar_transaction_logs_raf_katman ON Depo_Ruzgar_Transaction_Logs(raf_no, katman);

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_depo_ruzgar_products_updated_at ON Depo_Ruzgar_Products;
CREATE TRIGGER update_depo_ruzgar_products_updated_at 
    BEFORE UPDATE ON Depo_Ruzgar_Products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_depo_ruzgar_warehouse_layouts_updated_at ON Depo_Ruzgar_Warehouse_Layouts;
CREATE TRIGGER update_depo_ruzgar_warehouse_layouts_updated_at 
    BEFORE UPDATE ON Depo_Ruzgar_Warehouse_Layouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_depo_ruzgar_auth_passwords_updated_at ON Depo_Ruzgar_Auth_Passwords;
CREATE TRIGGER update_depo_ruzgar_auth_passwords_updated_at 
    BEFORE UPDATE ON Depo_Ruzgar_Auth_Passwords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
