// Mock Data - Sahte/Test Verisi
// Bu veriler sadece bellekte (RAM) tutuluyor, kalıcı değil

export const mockProducts = [
  {
    id: "1",
    urunAdi: "M8 Civata", // ← Sahte ürün
    kategori: "civata",
    olcu: "8mm",
    rafNo: "A",
    katman: "üst kat",
    kilogram: 2.5,
    notlar: "Paslanmaz çelik",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "2",
    urunAdi: "M10 Somun", // ← Sahte ürün
    kategori: "somun",
    olcu: "10mm",
    rafNo: "A",
    katman: "orta kat",
    kilogram: 1.8,
    notlar: "Galvanizli",
    createdAt: Date.now() - 172800000,
  },
  // ... daha fazla sahte ürün
]

// Mock Transaction Logs - Sahte işlem kayıtları
export const mockTransactionLogs = [
  {
    id: "log1",
    timestamp: Date.now() - 3600000,
    actionType: "Ekleme",
    rafNo: "A",
    katman: "üst kat",
    urunAdi: "M8 Civata", // ← Sahte işlem kaydı
    username: "Admin",
    productDetails: {
      urunAdi: "M8 Civata",
      olcu: "8mm",
      kilogram: 2.5,
      rafNo: "A",
      katman: "üst kat",
    },
  },
  // ... daha fazla sahte kayıt
]
