-- Insert default password (warehouse123) - bcrypt hash
INSERT INTO Depo_Ruzgar_Auth_Passwords (id, password_hash) 
VALUES ('main', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Insert default warehouse layout
INSERT INTO Depo_Ruzgar_Warehouse_Layouts (id, name, shelves) VALUES (
  'default',
  'Varsayılan Layout',
  '[
    {"id": "E", "x": 5, "y": 5, "width": 25, "height": 15},
    {"id": "çıkış yolu", "x": 35, "y": 5, "width": 30, "height": 35, "isCommon": true},
    {"id": "G", "x": 70, "y": 5, "width": 25, "height": 15},
    {"id": "D", "x": 5, "y": 25, "width": 25, "height": 15},
    {"id": "F", "x": 70, "y": 25, "width": 25, "height": 15},
    {"id": "B", "x": 20, "y": 45, "width": 20, "height": 15},
    {"id": "C", "x": 45, "y": 45, "width": 20, "height": 15},
    {"id": "A", "x": 5, "y": 55, "width": 10, "height": 40},
    {"id": "orta alan", "x": 20, "y": 75, "width": 75, "height": 20, "isCommon": true}
  ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  shelves = EXCLUDED.shelves;

-- Insert sample products
INSERT INTO Depo_Ruzgar_Products (id, urun_adi, kategori, olcu, raf_no, katman, kilogram, notlar) VALUES
  (uuid_generate_v4(), 'M8 Civata', 'civata', '8mm', 'A', 'üst kat', 2.5, 'Paslanmaz çelik'),
  (uuid_generate_v4(), 'M10 Somun', 'somun', '10mm', 'A', 'orta kat', 1.8, 'Galvanizli'),
  (uuid_generate_v4(), 'M6 Vida', 'vida', '6mm', 'B', 'üst kat', 0.5, 'Kısa vida'),
  (uuid_generate_v4(), 'Pul 8mm', 'pul', '8mm', 'C', 'alt kat', 0.2, 'Düz pul'),
  (uuid_generate_v4(), 'M12 Saplama', 'saplama', '12mm', 'D', 'üst kat', 3.2, 'Uzun saplama')
ON CONFLICT (id) DO NOTHING;

-- Insert sample transaction logs
INSERT INTO Depo_Ruzgar_Transaction_Logs (action_type, raf_no, katman, urun_adi, username, product_details) VALUES
  ('Ekleme', 'A', 'üst kat', 'M8 Civata', 'Admin', '{"urunAdi": "M8 Civata", "olcu": "8mm", "kilogram": 2.5, "rafNo": "A", "katman": "üst kat"}'::jsonb),
  ('Ekleme', 'A', 'orta kat', 'M10 Somun', 'Admin', '{"urunAdi": "M10 Somun", "olcu": "10mm", "kilogram": 1.8, "rafNo": "A", "katman": "orta kat"}'::jsonb),
  ('Ekleme', 'B', 'üst kat', 'M6 Vida', 'Admin', '{"urunAdi": "M6 Vida", "olcu": "6mm", "kilogram": 0.5, "rafNo": "B", "katman": "üst kat"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
