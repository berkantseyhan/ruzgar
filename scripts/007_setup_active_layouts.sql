-- Layout tablosuna aktif indikatör kolonu ekle
ALTER TABLE "Depo_Ruzgar_Warehouse_Layouts" 
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT false;

-- Mevcut tüm layout'ları sil
DELETE FROM "Depo_Ruzgar_Warehouse_Layouts";

-- Her depo için boş aktif layout oluştur
INSERT INTO "Depo_Ruzgar_Warehouse_Layouts" (
    id,
    warehouse_id,
    layout_data,
    is_active,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    w.id,
    '{"shelves": []}',
    true,
    NOW(),
    NOW()
FROM "Depo_Ruzgar_Warehouses" w;

-- Her depo için sadece 1 aktif layout olduğunu garanti et
CREATE OR REPLACE FUNCTION ensure_single_active_layout()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer yeni layout aktif yapılıyorsa, aynı deponun diğer layout'larını pasif yap
    IF NEW.is_active = true THEN
        UPDATE "Depo_Ruzgar_Warehouse_Layouts" 
        SET is_active = false 
        WHERE warehouse_id = NEW.warehouse_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
DROP TRIGGER IF EXISTS trigger_ensure_single_active_layout ON "Depo_Ruzgar_Warehouse_Layouts";
CREATE TRIGGER trigger_ensure_single_active_layout
    BEFORE INSERT OR UPDATE ON "Depo_Ruzgar_Warehouse_Layouts"
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_layout();
