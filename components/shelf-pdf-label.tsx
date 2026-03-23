"use client"

import { useRef } from "react"
import type { Product } from "@/lib/database"
import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShelfPdfLabelProps {
  shelfId: string
  shelfName: string
  warehouseName: string
  productsByLayer: Record<string, Product[]>
  shelfColor: string
}

const LAYER_COLORS: Record<string, string> = {
  "üst kat": "#6366f1",
  "orta kat": "#8b5cf6",
  "alt kat": "#ec4899",
  "a önü": "#f43f5e",
  "b önü": "#f97316",
  "c önü": "#eab308",
  "mutfak yanı": "#84cc16",
  "tezgah yanı": "#14b8a6",
  "dayının alanı": "#3b82f6",
  "cam kenarı": "#06b6d4",
  "tuvalet önü": "#10b981",
  "merdiven tarafı": "#6d28d9",
}

function getLayerColor(layer: string): string {
  return LAYER_COLORS[layer.toLowerCase()] ?? "#94a3b8"
}

export default function ShelfPdfLabel({
  shelfId,
  shelfName,
  warehouseName,
  productsByLayer,
  shelfColor,
}: ShelfPdfLabelProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const totalProducts = Object.values(productsByLayer).reduce((acc, arr) => acc + arr.length, 0)
  const layers = Object.keys(productsByLayer).filter((l) => productsByLayer[l].length > 0)
  const printDate = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open("", "_blank", "width=800,height=900")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${shelfName} - Raf Etiketi</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #fff;
            color: #1a1a2e;
            padding: 24px;
          }
          .page {
            max-width: 700px;
            margin: 0 auto;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
          }
          .header {
            background: ${shelfColor};
            color: #fff;
            padding: 20px 24px;
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .header-badge {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: rgba(255,255,255,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            font-weight: 900;
            letter-spacing: -1px;
            flex-shrink: 0;
          }
          .header-info h1 {
            font-size: 24px;
            font-weight: 800;
          }
          .header-info .subtitle {
            font-size: 13px;
            opacity: 0.85;
            margin-top: 4px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 24px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
          }
          .meta-row strong { color: #475569; }
          .layer-section {
            padding: 16px 24px;
            border-bottom: 1px solid #f1f5f9;
          }
          .layer-section:last-child { border-bottom: none; }
          .layer-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
          }
          .layer-dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            flex-shrink: 0;
          }
          .layer-title {
            font-size: 14px;
            font-weight: 700;
            text-transform: capitalize;
            color: #1e293b;
          }
          .layer-count {
            font-size: 11px;
            color: #94a3b8;
            margin-left: auto;
          }
          .product-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          .product-table th {
            text-align: left;
            padding: 6px 8px;
            background: #f1f5f9;
            color: #64748b;
            font-weight: 600;
            border-radius: 4px;
          }
          .product-table td {
            padding: 7px 8px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
            vertical-align: top;
          }
          .product-table tr:last-child td { border-bottom: none; }
          .product-name {
            font-weight: 600;
            color: #1e293b;
          }
          .product-note {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 2px;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 600;
            background: #f1f5f9;
            color: #64748b;
          }
          .footer {
            padding: 12px 24px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }
          .empty-layer {
            font-size: 12px;
            color: #94a3b8;
            font-style: italic;
            padding: 4px 0;
          }
          @media print {
            body { padding: 0; }
            .page { border: none; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="header-badge">${shelfId.substring(0, 2).toUpperCase()}</div>
            <div class="header-info">
              <h1>${shelfName}</h1>
              <div class="subtitle">${warehouseName} &bull; ${totalProducts} ürün &bull; ${layers.length} katman</div>
            </div>
          </div>
          <div class="meta-row">
            <span><strong>Raf No:</strong> ${shelfId}</span>
            <span><strong>Oluşturulma:</strong> ${printDate}</span>
          </div>
          ${layers
            .map(
              (layer) => `
            <div class="layer-section">
              <div class="layer-header">
                <div class="layer-dot" style="background:${getLayerColor(layer)}"></div>
                <span class="layer-title">${layer.charAt(0).toUpperCase() + layer.slice(1)}</span>
                <span class="layer-count">${productsByLayer[layer].length} ürün</span>
              </div>
              ${
                productsByLayer[layer].length === 0
                  ? `<p class="empty-layer">Bu katmanda ürün bulunmamaktadır.</p>`
                  : `
                <table class="product-table">
                  <thead>
                    <tr>
                      <th>Ürün Adı</th>
                      <th>Kategori</th>
                      <th>Ölçü</th>
                      <th>Kilogram</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productsByLayer[layer]
                      .map(
                        (p) => `
                      <tr>
                        <td>
                          <div class="product-name">${p.urunAdi}</div>
                          ${p.notlar ? `<div class="product-note">${p.notlar}</div>` : ""}
                        </td>
                        <td><span class="badge">${p.kategori}</span></td>
                        <td>${p.olcu}</td>
                        <td>${p.kilogram} kg</td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              `
              }
            </div>
          `,
            )
            .join("")}
          <div class="footer">
            Depo Envanter Yönetim Sistemi &bull; Bu belge otomatik olarak oluşturulmuştur.
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <Button
      onClick={handlePrint}
      size="sm"
      variant="outline"
      className="transition-colors duration-200 bg-transparent gap-2"
      title="Raf etiketini PDF olarak indir / yazdır"
    >
      <FileDown className="h-4 w-4" />
      PDF Etiket
    </Button>
  )
}
