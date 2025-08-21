-- Depo Rüzgar Warehouse Management System - Sample Data
-- Run this script AFTER running 001_create_depo_ruzgar_tables.sql

-- Clear existing data (except auth passwords)
DELETE FROM public."Depo_Ruzgar_Products";
DELETE FROM public."Depo_Ruzgar_Transaction_Logs";
DELETE FROM public."Depo_Ruzgar_Warehouse_Layouts";

-- Update the admin password to "admin123"
-- Hash generated with: bcrypt.hash("admin123", 10)
UPDATE public."Depo_Ruzgar_Auth_Passwords" 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjdBHGnqW5YJlaxOW.Ub6dUBdU.FHO', -- "admin123"
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Insert sample products
INSERT INTO public."Depo_Ruzgar_Products" (urun_adi, kategori, olcu, raf_no, katman, kilogram, notlar, created_at, updated_at)
VALUES 
    ('M8 Cıvata', 'Bağlantı Elemanları', '8mm', 'A', 'Üst', 15.500, 'Paslanmaz çelik', NOW(), NOW()),
    ('M10 Cıvata', 'Bağlantı Elemanları', '10mm', 'A', 'Orta', 25.750, 'Galvanizli', NOW(), NOW()),
    ('M12 Cıvata', 'Bağlantı Elemanları', '12mm', 'A', 'Alt', 35.250, 'Siyah oksit', NOW(), NOW()),
    ('Rulmanlı Yatak', 'Yatak Sistemleri', '6205', 'B', 'Üst', 8.500, 'Kapalı tip', NOW(), NOW()),
    ('Kayış', 'Güç Aktarımı', 'A-50', 'B', 'Orta', 12.300, 'V kayış', NOW(), NOW()),
    ('Zincir', 'Güç Aktarımı', '12B-1', 'B', 'Alt', 18.750, 'Tek sıra', NOW(), NOW()),
    ('Hidrolik Silindir', 'Hidrolik', '50x300', 'C', 'Üst', 45.000, 'Çift etkili', NOW(), NOW()),
    ('Hidrolik Hortum', 'Hidrolik', '1/2"', 'C', 'Orta', 22.500, '210 bar', NOW(), NOW()),
    ('Fren Balata', 'Fren Sistemleri', 'FB-200', 'C', 'Alt', 8.750, 'Organik', NOW(), NOW()),
    ('Motor Yağı', 'Yağlama', '15W-40', 'D', 'Üst', 180.000, '20L bidon', NOW(), NOW()),
    ('Gres', 'Yağlama', 'EP-2', 'D', 'Orta', 15.500, 'Lityum bazlı', NOW(), NOW()),
    ('Conta Seti', 'Sızdırmazlık', 'CS-100', 'D', 'Alt', 2.250, 'NBR kauçuk', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert sample transaction logs
INSERT INTO public."Depo_Ruzgar_Transaction_Logs" (action_type, raf_no, katman, urun_adi, username, changes, product_details, session_info, created_at)
VALUES 
    ('Ekleme', 'A', 'Üst', 'M8 Cıvata', 'admin', '[]'::jsonb, '{"kategori": "Bağlantı Elemanları", "olcu": "8mm", "kilogram": 15.5}'::jsonb, '{}'::jsonb, NOW() - INTERVAL '2 days'),
    ('Ekleme', 'A', 'Orta', 'M10 Cıvata', 'admin', '[]'::jsonb, '{"kategori": "Bağlantı Elemanları", "olcu": "10mm", "kilogram": 25.75}'::jsonb, '{}'::jsonb, NOW() - INTERVAL '2 days'),
    ('Güncelleme', 'A', 'Üst', 'M8 Cıvata', 'admin', '[{"field": "kilogram", "oldValue": "10.5", "newValue": "15.5"}]'::jsonb, '{"kategori": "Bağlantı Elemanları", "olcu": "8mm", "kilogram": 15.5}'::jsonb, '{}'::jsonb, NOW() - INTERVAL '1 day'),
    ('Ekleme', 'B', 'Üst', 'Rulmanlı Yatak', 'admin', '[]'::jsonb, '{"kategori": "Yatak Sistemleri", "olcu": "6205", "kilogram": 8.5}'::jsonb, '{}'::jsonb, NOW() - INTERVAL '1 day'),
    ('Giriş', '', '', '', 'admin', '[]'::jsonb, '{}'::jsonb, '{"loginTime": 1640995200000, "ipAddress": "192.168.1.100"}'::jsonb, NOW() - INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

-- Insert default warehouse layout
INSERT INTO public."Depo_Ruzgar_Warehouse_Layouts" (name, shelves, created_at, updated_at)
VALUES (
    'Ana Depo Düzeni',
    '[
        {
            "id": "raf-a",
            "name": "Raf A",
            "x": 100,
            "y": 100,
            "width": 120,
            "height": 80,
            "rotation": 0,
            "layers": ["Üst", "Orta", "Alt"]
        },
        {
            "id": "raf-b", 
            "name": "Raf B",
            "x": 300,
            "y": 100,
            "width": 120,
            "height": 80,
            "rotation": 0,
            "layers": ["Üst", "Orta", "Alt"]
        },
        {
            "id": "raf-c",
            "name": "Raf C", 
            "x": 100,
            "y": 250,
            "width": 120,
            "height": 80,
            "rotation": 0,
            "layers": ["Üst", "Orta", "Alt"]
        },
        {
            "id": "raf-d",
            "name": "Raf D",
            "x": 300,
            "y": 250,
            "width": 120,
            "height": 80,
            "rotation": 0,
            "layers": ["Üst", "Orta", "Alt"]
        }
    ]'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Depo Rüzgar seed data inserted successfully!';
    RAISE NOTICE 'Sample data added:';
    RAISE NOTICE '  - 12 sample products';
    RAISE NOTICE '  - 1 warehouse layout with 4 shelves';
    RAISE NOTICE '  - 5 sample transaction logs';
    RAISE NOTICE '';
    RAISE NOTICE 'Admin password updated to: "admin123"';
    RAISE NOTICE 'You can now login with password: admin123';
END $$;
