-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE products (
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

-- Transaction logs table
CREATE TABLE transaction_logs (
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

-- Warehouse layouts table
CREATE TABLE warehouse_layouts (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  name VARCHAR(255) NOT NULL,
  shelves JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auth passwords table
CREATE TABLE auth_passwords (
  id VARCHAR(20) PRIMARY KEY DEFAULT 'main',
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_products_raf_katman ON products(raf_no, katman);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_transaction_logs_timestamp ON transaction_logs(timestamp DESC);
CREATE INDEX idx_transaction_logs_raf_katman ON transaction_logs(raf_no, katman);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouse_layouts_updated_at BEFORE UPDATE ON warehouse_layouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_passwords_updated_at BEFORE UPDATE ON auth_passwords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
