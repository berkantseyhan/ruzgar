"use client"

import { useEffect, useState } from "react"
import type { Layer, Product, ShelfId, WarehouseLayout } from "@/lib/database"
import { getAvailableLayersForShelf } from "@/lib/database"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Plus, RefreshCw, Loader2, Package, Layers } from "lucide-react"
import ProductForm from "@/components/product-form"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { useWarehouse } from "@/lib/warehouse-context"
import { cn } from "@/lib/utils"

interface ShelfModalProps {
  shelfId: ShelfId
  onClose: () => void
  onRefresh?: () => void
}

// Validation function to ensure layout has proper structure
function validateAndNormalizeLayout(data: any): WarehouseLayout | null {
  console.log("Validating layout data in shelf modal:", data)

  // If data is null or undefined, return null
  if (!data) {
    console.log("Data is null/undefined")
    return null
  }

  // Extract layout from data if it's wrapped
  const layout = data.layout || data

  // Validate layout structure
  if (!layout || typeof layout !== "object") {
    console.log("Invalid layout structure")
    return null
  }

  // Ensure shelves is an array
  let normalizedShelves = []

  if (Array.isArray(layout.shelves)) {
    console.log("Shelves is already an array")
    normalizedShelves = layout.shelves.map(normalizeShelf)
  } else if (layout.shelves && typeof layout.shelves === "object") {
    console.log("Converting shelves object to array")
    // Convert object to array
    normalizedShelves = Object.values(layout.shelves).map(normalizeShelf)
  } else {
    console.log("No valid shelves found")
    normalizedShelves = []
  }

  const normalizedLayout: WarehouseLayout = {
    shelves: normalizedShelves,
    lastModified: layout.lastModified || Date.now(),
    version: layout.version || "1.0",
  }

  console.log("Normalized layout in shelf modal:", normalizedLayout)
  return normalizedLayout
}

// Normalize individual shelf data
function normalizeShelf(shelf: any) {
  return {
    id: shelf.id || `shelf-${Math.random()}`,
    x: typeof shelf.x === "number" ? shelf.x : 10,
    y: typeof shelf.y === "number" ? shelf.y : 10,
    width: typeof shelf.width === "number" ? shelf.width : 80,
    height: typeof shelf.height === "number" ? shelf.height : 60,
    isCommon: Boolean(shelf.isCommon),
    rotation: typeof shelf.rotation === "number" ? shelf.rotation : 0,
    name: shelf.name || shelf.id || "Unnamed Shelf",
    customLayers: Array.isArray(shelf.customLayers) ? shelf.customLayers : undefined,
  }
}

export default function ShelfModal({ shelfId, onClose, onRefresh }: ShelfModalProps) {
  const [warehouseLayout, setWarehouseLayout] = useState<WarehouseLayout | null>(null)
  const [availableLayers, setAvailableLayers] = useState<{ value: Layer; label: string }[]>([])
  const [activeLayer, setActiveLayer] = useState<Layer>("üst kat")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const { toast } = useToast()
  const { username } = useAuth()
  const { currentWarehouse } = useWarehouse()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Fetch warehouse layout and set up available layers
  useEffect(() => {
    const fetchLayout = async () => {
      if (!currentWarehouse) {
        console.log("No current warehouse selected, skipping layout fetch")
        return
      }

      try {
        console.log(`Fetching layout for shelf: ${shelfId} in warehouse: ${currentWarehouse.name}`)
        const response = await fetch(`/api/layout?warehouse_id=${currentWarehouse.id}&t=${Date.now()}`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (response.ok) {
          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await response.text()
            console.error("Non-JSON response received:", textResponse.substring(0, 200))
            throw new Error("Sunucu JSON yanıtı döndürmedi")
          }

          const data = await response.json()
          console.log("Raw layout data received in shelf modal:", data)

          const layout = validateAndNormalizeLayout(data)

          if (layout && Array.isArray(layout.shelves)) {
            console.log("Validated layout:", layout)
            setWarehouseLayout(layout)

            const layers = getAvailableLayersForShelf(shelfId, layout)
            console.log(`Available layers for ${shelfId}:`, layers)

            const layerOptions = layers.map((layer) => ({
              value: layer as Layer,
              label: layer.charAt(0).toUpperCase() + layer.slice(1),
            }))

            setAvailableLayers(layerOptions)
            console.log("Layer options set:", layerOptions)

            if (layerOptions.length > 0) {
              const currentLayerValid = layerOptions.some((layer) => layer.value === activeLayer)
              if (!currentLayerValid) {
                console.log(`Setting active layer to: ${layerOptions[0].value}`)
                setActiveLayer(layerOptions[0].value)
              } else {
                console.log(`Keeping current active layer: ${activeLayer}`)
              }
            }
          } else {
            console.error("Failed to validate layout, using fallback")
            const defaultLayers = getDefaultLayers(shelfId)
            setAvailableLayers(defaultLayers)
            if (defaultLayers.length > 0 && !defaultLayers.some((layer) => layer.value === activeLayer)) {
              setActiveLayer(defaultLayers[0].value)
            }
          }
        } else {
          console.error("Failed to fetch layout, using fallback")
          const defaultLayers = getDefaultLayers(shelfId)
          setAvailableLayers(defaultLayers)
          if (defaultLayers.length > 0 && !defaultLayers.some((layer) => layer.value === activeLayer)) {
            setActiveLayer(defaultLayers[0].value)
          }
        }
      } catch (error) {
        console.error("Error fetching layout:", error)
        const defaultLayers = getDefaultLayers(shelfId)
        setAvailableLayers(defaultLayers)
        if (defaultLayers.length > 0 && !defaultLayers.some((layer) => layer.value === activeLayer)) {
          setActiveLayer(defaultLayers[0].value)
        }
      }
    }

    fetchLayout()
  }, [shelfId, refreshTrigger, currentWarehouse])

  // Get default layers based on shelf type (fallback)
  const getDefaultLayers = (shelfId: ShelfId): { value: Layer; label: string }[] => {
    if (shelfId === "��ıkış yolu") {
      return [
        { value: "dayının alanı", label: "Dayının Alanı" },
        { value: "cam kenarı", label: "Cam Kenarı" },
        { value: "tuvalet önü", label: "Tuvalet Önü" },
        { value: "merdiven tarafı", label: "Merdiven Tarafı" },
      ]
    } else if (shelfId === "orta alan") {
      return [
        { value: "a önü", label: "A Önü" },
        { value: "b önü", label: "B Önü" },
        { value: "c önü", label: "C Önü" },
        { value: "mutfak yanı", label: "Mutfak Yanı" },
        { value: "tezgah yanı", label: "Tezgah Yanı" },
      ]
    } else {
      return [
        { value: "üst kat", label: "Üst Kat" },
        { value: "orta kat", label: "Orta Kat" },
        { value: "alt kat", label: "Alt Kat" },
      ]
    }
  }

  const fetchProducts = async () => {
    if (!currentWarehouse) {
      console.log("No current warehouse selected, skipping products fetch")
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const encodedLayer = encodeURIComponent(activeLayer)
      const url = `/api/products?shelfId=${shelfId}&layer=${encodedLayer}&warehouse_id=${currentWarehouse.id}`
      console.log(`Fetching products from: ${url}`)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
        },
      })

      console.log(`Response status: ${response.status}`)
      console.log(`Response content-type: ${response.headers.get("content-type")}`)

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("Non-JSON response received:", textResponse.substring(0, 200))
        throw new Error("Sunucu JSON yanıtı döndürmedi")
      }

      const data = await response.json()
      console.log("Parsed JSON data:", data)

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      if (data.success === false) {
        throw new Error(data.error || "API returned success: false")
      }

      console.log(`Received ${data.products?.length || 0} products`)
      setProducts(data.products || [])
    } catch (err) {
      console.error("Error fetching products:", err)
      const errorMessage = err instanceof Error ? err.message : "Ürünler yüklenirken bir hata oluştu"
      setError(errorMessage)
      setProducts([]) // Set empty array on error
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeLayer && currentWarehouse) {
      fetchProducts()
    }
  }, [shelfId, activeLayer, currentWarehouse])

  const handleDeleteProduct = async (product: Product) => {
    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product,
          username: username || "Bilinmeyen Kullanıcı",
        }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("Non-JSON response received:", textResponse.substring(0, 200))
        throw new Error("Sunucu JSON yanıtı döndürmedi")
      }

      const data = await response.json()

      if (!response.ok || data.success === false) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      setProducts(products.filter((p) => p.id !== product.id))
      toast({
        title: "Başarılı",
        description: "Ürün başarıyla silindi.",
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      const errorMessage = error instanceof Error ? error.message : "Ürün silinirken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEditClick = (product: Product) => {
    console.log("Editing product:", product.id)
    setEditingProduct(product)
  }

  const handleAddClick = () => {
    setIsAddingProduct(true)
  }

  const handleFormSuccess = () => {
    setEditingProduct(null)
    setIsAddingProduct(false)
    fetchProducts()
  }

  const getShelfColor = () => {
    switch (shelfId) {
      case "A":
        return "bg-shelf-a text-white"
      case "B":
        return "bg-shelf-b text-white"
      case "C":
        return "bg-shelf-c text-white"
      case "D":
        return "bg-shelf-d text-white"
      case "E":
        return "bg-shelf-e text-white"
      case "F":
        return "bg-shelf-f text-white"
      case "G":
        return "bg-shelf-g text-white"
      default:
        return "bg-shelf-common text-white"
    }
  }

  const renderContent = () => {
    const currentShelf = warehouseLayout?.shelves.find((shelf) => shelf.id === shelfId)
    const shelfDisplayName = currentShelf?.name || `${shelfId} Rafı`

    if (editingProduct) {
      return (
        <ProductForm
          initialData={editingProduct}
          onSuccess={handleFormSuccess}
          onCancel={() => setEditingProduct(null)}
        />
      )
    }

    if (isAddingProduct) {
      return (
        <ProductForm
          initialData={{ rafNo: shelfId, katman: activeLayer } as Partial<Product>}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsAddingProduct(false)}
        />
      )
    }

    return (
      <>
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg ${getShelfColor()} flex items-center justify-center font-bold text-xs shadow-sm shrink-0`}
            >
              {(currentShelf?.name || shelfId).substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">{shelfDisplayName}</p>
              <p className="text-xs text-muted-foreground capitalize">{activeLayer}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {error && (
              <Button
                onClick={fetchProducts}
                size="sm"
                variant="outline"
                className="h-8 text-xs px-3"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Yenile
              </Button>
            )}
            <Button onClick={handleAddClick} size="sm" className="h-8 text-xs px-3 bg-primary">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Ürün Ekle
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Ürünler yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="py-8 px-4 text-center rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <p className="mt-1 text-xs text-muted-foreground">Lütfen tekrar deneyin.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-lg bg-muted/30 border border-dashed border-border">
            <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">Bu raf ve katmanda ürün bulunmamaktadır.</p>
            <Button onClick={handleAddClick} variant="outline" size="sm" className="h-8 text-xs mt-1">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Ürün Ekle
            </Button>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="group relative flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary/30 hover:shadow-sm transition-all duration-150"
              >
                {/* Color dot / icon */}
                <div className={`mt-0.5 w-8 h-8 rounded-lg ${getShelfColor()} flex items-center justify-center shrink-0`}>
                  <Package className="h-4 w-4 text-white/90" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground leading-tight truncate">{product.urunAdi}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0 font-normal">
                      {product.kategori}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span>
                      <span className="text-foreground/60">Ölçü: </span>
                      <span className="font-medium text-foreground">{product.olcu}</span>
                    </span>
                    <span>
                      <span className="text-foreground/60">Ağırlık: </span>
                      <span className="font-medium text-foreground">{product.kilogram} kg</span>
                    </span>
                  </div>
                  {product.notlar && (
                    <p className="mt-1.5 text-xs text-muted-foreground bg-muted/40 rounded-md px-2 py-1 leading-relaxed">
                      {product.notlar}
                    </p>
                  )}
                </div>

                {/* Actions — reveal on hover */}
                <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    onClick={() => handleEditClick(product)}
                    className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    title="Düzenle"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  const refreshModal = () => {
    setRefreshTrigger((prev) => prev + 1)
    if (onRefresh) {
      onRefresh()
    }
  }

  useEffect(() => {
    ;(window as any).refreshShelfModal = refreshModal
    return () => {
      delete (window as any).refreshShelfModal
    }
  }, [])

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto border border-border bg-background shadow-2xl rounded-xl p-0">
        {/* Modal header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <div
              className={`w-6 h-6 rounded-md ${getShelfColor()} flex items-center justify-center text-[10px] font-bold shadow-sm`}
            >
              {warehouseLayout?.shelves
                .find((s) => s.id === shelfId)
                ?.name?.substring(0, 2)
                .toUpperCase() || "R"}
            </div>
            Raf Detayları
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4">
          {/* Layer selector */}
          <Tabs value={activeLayer} onValueChange={(value) => setActiveLayer(value as Layer)}>
            <div className="mb-5">
              <div className="flex flex-wrap gap-1.5 p-1.5 bg-muted rounded-xl">
                {availableLayers.map((layer) => (
                  <button
                    key={layer.value}
                    onClick={() => setActiveLayer(layer.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 min-w-[90px] justify-center",
                      activeLayer === layer.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                    )}
                  >
                    <Layers className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{layer.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-1.5">
                <span className="text-[11px] text-muted-foreground">
                  {availableLayers.length} katman mevcut
                </span>
              </div>
            </div>

            {availableLayers.map((layer) => (
              <TabsContent key={layer.value} value={layer.value} className="mt-0">
                {renderContent()}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
