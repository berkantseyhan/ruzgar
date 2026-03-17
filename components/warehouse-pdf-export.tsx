"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Printer } from "lucide-react"
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

  useEffect(() => {
    if (isOpen && selectedWarehouse) {
      setSelectedWarehouseId(selectedWarehouse.id)
      setCurrentWarehouse(selectedWarehouse)
      setCurrentLayout(activeLayout)
    }
  }, [isOpen, selectedWarehouse, activeLayout])

  useEffect(() => {
    const loadWarehouseData = async () => {
      if (!selectedWarehouseId || !isOpen) return

      const warehouse = warehouses.find((w) => w.id === selectedWarehouseId)
      if (!warehouse) return

      setCurrentWarehouse(warehouse)
      setLoading(true)

      try {
        const layoutResponse = await fetch(`/api/layout?warehouse_id=${selectedWarehouseId}`)
        if (layoutResponse.ok) {
          const layoutData = await layoutResponse.json()
          setCurrentLayout(layoutData.layout)

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
              layerProducts.push({
                layer,
                products: Array.isArray(data) ? data : data.products || [],
              })
            }
          } catch (error) {
            console.error(`Error fetching products for layer ${layer}:`, error)
            layerProducts.push({ layer, products: [] })
          }
        }

        results.push({
          shelf,
          layers: layerProducts,
        })
      }

      setShelfProducts(results)
    } catch (error) {
      console.error("Error fetching all products:", error)
      setShelfProducts([])
    }
  }

  const handlePrint = () => {
    if (!printRef.current) return
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printRef.current.innerHTML)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const formatDate = () => {
    const now = new Date()
    return now.toLocaleString("tr-TR")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Raf Etiketlerini Yazdır</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warehouse Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Depo Seçin</label>
            <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
              <SelectTrigger>
                <SelectValue placeholder="Depo seçiniz..." />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Print Button */}
          <div className="flex gap-2">
            <Button onClick={handlePrint} disabled={loading || shelfProducts.length === 0} className="gap-2">
              <Printer className="h-4 w-4" />
              Yazdır / PDF
            </Button>
          </div>

          {/* Preview */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Yükleniyor...</span>
            </div>
          ) : (
            <div
              ref={printRef}
              className="bg-white text-black"
              style={{
                width: "210mm",
                margin: "0 auto",
              }}
            >
              {shelfProducts.length === 0 ? (
                <div className="p-8 text-center">Bu depoda raf bulunmamaktadır.</div>
              ) : (
                shelfProducts.map((sp, shelfIndex) => {
                  const totalProducts = sp.layers.reduce((sum, l) => sum + l.products.length, 0)
                  const totalWeight = sp.layers.reduce(
                    (sum, l) => sum + l.products.reduce((w, p) => w + (p.kilogram || 0), 0),
                    0
                  )

                  return (
                    <div
                      key={sp.shelf.id}
                      style={{
                        pageBreakAfter: "always",
                        padding: "40px",
                        minHeight: "297mm",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Header */}
                      <div style={{ textAlign: "center", marginBottom: "30px" }}>
                        <p style={{ fontSize: "14px", color: "#666", margin: "0 0 10px 0" }}>
                          {currentWarehouse?.name || "Depo"}
                        </p>
                        <h1 style={{ fontSize: "60px", fontWeight: "bold", margin: "0", color: "#000" }}>
                          {sp.shelf.name || sp.shelf.id}
                        </h1>
                        <p style={{ fontSize: "14px", color: "#666", margin: "10px 0 0 0" }}>
                          {sp.layers.length} katman
                        </p>
                      </div>

                      {/* Divider Line */}
                      <div
                        style={{
                          height: "3px",
                          backgroundColor: "#000",
                          marginBottom: "30px",
                        }}
                      />

                      {/* Summary Stats */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "40px",
                          marginBottom: "30px",
                          backgroundColor: "#f5f5f5",
                          padding: "20px",
                          textAlign: "center",
                        }}
                      >
                        <div>
                          <p style={{ fontSize: "32px", fontWeight: "bold", margin: "0", color: "#000" }}>
                            {totalProducts}
                          </p>
                          <p style={{ fontSize: "12px", color: "#ff6b35", margin: "5px 0 0 0" }}>Toplam Ürün</p>
                        </div>
                        <div>
                          <p style={{ fontSize: "32px", fontWeight: "bold", margin: "0", color: "#000" }}>
                            {totalWeight.toFixed(0)}
                          </p>
                          <p style={{ fontSize: "12px", color: "#ff6b35", margin: "5px 0 0 0" }}>Toplam Kilogram</p>
                        </div>
                      </div>

                      {/* Layers */}
                      <div style={{ flex: 1 }}>
                        {sp.layers.map((layerData) => (
                          <div key={layerData.layer} style={{ marginBottom: "25px" }}>
                            {/* Layer Header */}
                            <div
                              style={{
                                backgroundColor: "#e8e8e8",
                                padding: "10px 12px",
                                fontWeight: "bold",
                                fontSize: "12px",
                                marginBottom: "12px",
                                textTransform: "lowercase",
                              }}
                            >
                              {layerData.layer}
                            </div>

                            {/* Products */}
                            <div style={{ border: "1px solid #ddd", borderRadius: "4px", overflow: "hidden" }}>
                              {layerData.products.map((product, idx) => (
                                <div
                                  key={product.id}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    padding: "12px",
                                    borderBottom: idx < layerData.products.length - 1 ? "1px solid #eee" : "none",
                                    backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                                  }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: "13px", fontWeight: "bold", margin: "0 0 4px 0", color: "#000" }}>
                                      {product.urunAdi}
                                    </p>
                                    <p
                                      style={{
                                        fontSize: "11px",
                                        color: "#666",
                                        margin: "0",
                                      }}
                                    >
                                      {product.kategori}
                                      {product.kategori && product.olcu ? " • " : ""}
                                      {product.olcu}
                                      {(product.kategori || product.olcu) && product.kilogram ? " • " : ""}
                                      {product.kilogram} kg
                                    </p>
                                    {product.notlar && (
                                      <p style={{ fontSize: "10px", color: "#999", margin: "3px 0 0 0", fontStyle: "italic" }}>
                                        {product.notlar}
                                      </p>
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: "bold",
                                      color: "#004a7f",
                                      marginLeft: "20px",
                                      minWidth: "70px",
                                      textAlign: "right",
                                    }}
                                  >
                                    {product.kilogram} kg
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div
                        style={{
                          marginTop: "40px",
                          paddingTop: "15px",
                          borderTop: "1px solid #ddd",
                          textAlign: "center",
                          fontSize: "10px",
                          color: "#999",
                        }}
                      >
                        Yazdırma Tarihi: {formatDate()}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            "Yazdır / PDF" butonuna tıklayarak her rafı ayrı sayfa halinde yazdırabilir veya PDF olarak kaydedebilirsiniz.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
