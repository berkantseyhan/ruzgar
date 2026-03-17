"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Printer, FileText } from "lucide-react"
import type { Product, ShelfLayout, WarehouseLayout, Warehouse, Layer } from "@/lib/database"
import { getAvailableLayersForShelf } from "@/lib/database"
import { useWarehouse } from "@/lib/warehouse-context"

interface WarehousePdfExportProps {
  isOpen: boolean
  onClose: () => void
}

interface ShelfProducts {
  shelf: ShelfLayout
  layers: {
    layer: Layer
    products: Product[]
  }[]
}

export function WarehousePdfExport({ isOpen, onClose }: WarehousePdfExportProps) {
  const { warehouses, selectedWarehouse, activeLayout, isLoading: warehouseLoading } = useWarehouse()
  const [loading, setLoading] = useState(false)
  const [shelfProducts, setShelfProducts] = useState<ShelfProducts[]>([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("")
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | null>(null)
  const [currentLayout, setCurrentLayout] = useState<WarehouseLayout | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  // Set initial warehouse when dialog opens
  useEffect(() => {
    if (isOpen && selectedWarehouse) {
      setSelectedWarehouseId(selectedWarehouse.id)
      setCurrentWarehouse(selectedWarehouse)
      setCurrentLayout(activeLayout)
    }
  }, [isOpen, selectedWarehouse, activeLayout])

  // Load warehouse data when selection changes
  useEffect(() => {
    const loadWarehouseData = async () => {
      if (!selectedWarehouseId || !isOpen) return

      const warehouse = warehouses.find(w => w.id === selectedWarehouseId)
      if (!warehouse) return

      setCurrentWarehouse(warehouse)
      setLoading(true)

      try {
        // Fetch layout for this warehouse
        const layoutResponse = await fetch(`/api/layout?warehouse_id=${selectedWarehouseId}`)
        if (layoutResponse.ok) {
          const layoutData = await layoutResponse.json()
          setCurrentLayout(layoutData.layout)
          
          // Now fetch products for each shelf
          if (layoutData.layout?.shelves?.length > 0) {
            await fetchAllProducts(warehouse, layoutData.layout)
          } else {
            setShelfProducts([])
          }
        }
      } catch (error) {
        console.error("Error loading warehouse data:", error)
        setShelfProducts([])
      } finally {
        setLoading(false)
      }
    }

    loadWarehouseData()
  }, [selectedWarehouseId, warehouses, isOpen])

  const fetchAllProducts = async (warehouse: Warehouse, layout: WarehouseLayout) => {
    if (!layout || !layout.shelves || layout.shelves.length === 0) {
      setShelfProducts([])
      return
    }

    try {
      const results: ShelfProducts[] = []

      for (const shelf of layout.shelves) {
        const layers = getAvailableLayersForShelf(shelf.id, layout)
        const layerProducts: { layer: Layer; products: Product[] }[] = []

        for (const layer of layers) {
          try {
            const response = await fetch(
              `/api/products?shelfId=${encodeURIComponent(shelf.id)}&layer=${encodeURIComponent(layer)}&warehouse_id=${warehouse.id}`,
              {
                method: "GET",
                headers: {
                  "Cache-Control": "no-cache",
                  "Content-Type": "application/json",
                },
              }
            )

            if (response.ok) {
              const data = await response.json()
              if (data.products && data.products.length > 0) {
                layerProducts.push({
                  layer: layer as Layer,
                  products: data.products,
                })
              }
            }
          } catch (error) {
            console.error(`Error fetching products for shelf ${shelf.id}, layer ${layer}:`, error)
          }
        }

        if (layerProducts.length > 0) {
          results.push({
            shelf,
            layers: layerProducts,
          })
        }
      }

      setShelfProducts(results)
    } catch (error) {
      console.error("Error fetching all products:", error)
      setShelfProducts([])
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Lutfen popup engelleyiciyi devre disi birakin")
      return
    }

    const styles = `
      <style>
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 11px;
          line-height: 1.3;
          color: #000;
          background: #fff;
        }
        
        .print-container {
          padding: 10px;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        .header h1 {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .header p {
          font-size: 11px;
          color: #666;
        }
        
        .shelf-section {
          margin-bottom: 15px;
          page-break-inside: avoid;
        }
        
        .shelf-header {
          background: #333;
          color: white;
          padding: 8px 12px;
          font-size: 14px;
          font-weight: bold;
          border-radius: 4px 4px 0 0;
        }
        
        .shelf-content {
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 4px 4px;
        }
        
        .layer-section {
          border-bottom: 1px solid #eee;
        }
        
        .layer-section:last-child {
          border-bottom: none;
        }
        
        .layer-header {
          background: #f5f5f5;
          padding: 6px 12px;
          font-weight: 600;
          font-size: 12px;
          border-bottom: 1px solid #eee;
        }
        
        .products-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .products-table th,
        .products-table td {
          padding: 5px 8px;
          text-align: left;
          border-bottom: 1px solid #eee;
          font-size: 10px;
        }
        
        .products-table th {
          background: #fafafa;
          font-weight: 600;
          font-size: 9px;
          text-transform: uppercase;
          color: #666;
        }
        
        .products-table tr:last-child td {
          border-bottom: none;
        }
        
        .product-name {
          font-weight: 500;
        }
        
        .product-kg {
          font-family: monospace;
          text-align: right;
        }
        
        .product-notes {
          color: #666;
          font-size: 9px;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 9px;
          color: #999;
        }
        
        .empty-message {
          padding: 20px;
          text-align: center;
          color: #666;
        }
        
        .summary {
          background: #f0f0f0;
          padding: 10px;
          margin-bottom: 15px;
          border-radius: 4px;
          display: flex;
          justify-content: space-around;
        }
        
        .summary-item {
          text-align: center;
        }
        
        .summary-value {
          font-size: 18px;
          font-weight: bold;
        }
        
        .summary-label {
          font-size: 10px;
          color: #666;
        }
      </style>
    `

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${currentWarehouse?.name || 'Depo'} - Depo Raporu</title>
          ${styles}
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const getTotalProducts = () => {
    return shelfProducts.reduce(
      (total, sp) => total + sp.layers.reduce((layerTotal, l) => layerTotal + l.products.length, 0),
      0
    )
  }

  const getTotalWeight = () => {
    return shelfProducts
      .reduce(
        (total, sp) =>
          total + sp.layers.reduce((layerTotal, l) => layerTotal + l.products.reduce((w, p) => w + (p.kilogram || 0), 0), 0),
        0
      )
      .toFixed(2)
  }

  const getShelfColor = (shelfId: string) => {
    switch (shelfId) {
      case "A":
        return "#3b82f6"
      case "B":
        return "#22c55e"
      case "C":
        return "#f59e0b"
      case "D":
        return "#ef4444"
      case "E":
        return "#8b5cf6"
      case "F":
        return "#06b6d4"
      case "G":
        return "#ec4899"
      default:
        return "#6b7280"
    }
  }

  const formatDate = () => {
    return new Date().toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Raf Etiketi Yazdır
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Warehouse Selection */}
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-medium whitespace-nowrap">Depo Seçin:</label>
            <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Depo seçin..." />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handlePrint} disabled={loading || !currentWarehouse} className="flex items-center gap-2 ml-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              Yazdir / PDF
            </Button>
          </div>

          {loading || warehouseLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Ürünler yükleniyor...</p>
            </div>
          ) : !currentWarehouse ? (
            <div className="text-center py-12 text-muted-foreground">
              Lütfen bir depo seçin
            </div>
          ) : (
            <div>
              {/* Preview */}
              <div className="border rounded-lg p-4 bg-white text-black overflow-auto max-h-[55vh]">
                <div ref={printRef} className="print-container">
                  <div className="header">
                    <h1>{currentWarehouse.name}</h1>
                    <p>Depo Envanter Raporu - {formatDate()}</p>
                  </div>

                  <div className="summary">
                    <div className="summary-item">
                      <div className="summary-value">{currentLayout?.shelves?.length || 0}</div>
                      <div className="summary-label">Toplam Raf</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-value">{getTotalProducts()}</div>
                      <div className="summary-label">Toplam Ürün</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-value">{getTotalWeight()} kg</div>
                      <div className="summary-label">Toplam Agirlik</div>
                    </div>
                  </div>

                  {shelfProducts.length === 0 ? (
                    <div className="empty-message">Bu depoda henüz ürün bulunmamaktadir.</div>
                  ) : (
                    shelfProducts.map((sp) => (
                      <div key={sp.shelf.id} className="shelf-section">
                        <div className="shelf-header" style={{ backgroundColor: getShelfColor(sp.shelf.id) }}>
                          {sp.shelf.name || sp.shelf.id} Rafi
                        </div>
                        <div className="shelf-content">
                          {sp.layers.map((layerData) => (
                            <div key={layerData.layer} className="layer-section">
                              <div className="layer-header">{layerData.layer}</div>
                              <table className="products-table">
                                <thead>
                                  <tr>
                                    <th style={{ width: "30%" }}>Ürün Adi</th>
                                    <th style={{ width: "15%" }}>Kategori</th>
                                    <th style={{ width: "15%" }}>Ölçü</th>
                                    <th style={{ width: "12%", textAlign: "right" }}>Kilogram</th>
                                    <th style={{ width: "28%" }}>Notlar</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {layerData.products.map((product) => (
                                    <tr key={product.id}>
                                      <td className="product-name">{product.urunAdi}</td>
                                      <td>{product.kategori}</td>
                                      <td>{product.olcu}</td>
                                      <td className="product-kg">{product.kilogram}</td>
                                      <td className="product-notes">{product.notlar || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}

                  <div className="footer">
                    Depo Envanter Yönetim Sistemi | {formatDate()}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-4 text-center">
                "Yazdir / PDF" butonuna tiklayarak bu raporu yazdirabilir veya PDF olarak kaydedebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
