"use client"

import { useEffect, useState } from "react"
import type { Layer, Product, ShelfId, WarehouseLayout } from "@/lib/database"
import { getAvailableLayersForShelf } from "@/lib/database"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, Plus, RefreshCw, Loader2, Package, Layers } from "lucide-react"
import ProductForm from "@/components/product-form"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { useWarehouse } from "@/lib/warehouse-context"

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
    if (shelfId === "çıkış yolu") {
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
    const shelfIndicatorName = currentShelf?.name?.substring(0, 2).toUpperCase() || "R"

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
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full ${getShelfColor()} flex items-center justify-center font-bold shadow-md`}
            >
              {shelfIndicatorName}
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                {shelfDisplayName}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{activeLayer}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {error && (
              <Button
                onClick={fetchProducts}
                size="sm"
                variant="outline"
                className="transition-colors duration-200 bg-transparent"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </Button>
            )}
            <Button onClick={handleAddClick} size="sm" className="transition-colors duration-200 bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Ürün Ekle
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-40 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Ürünler yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive bg-destructive/10 rounded-lg border border-destructive/20 p-4">
            <p className="font-medium">{error}</p>
            <p className="mt-2 text-muted-foreground">Lütfen tekrar deneyin veya yeni bir ürün ekleyin.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/50 rounded-lg border border-dashed">
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="mb-2">Bu raf ve katmanda ürün bulunmamaktadır.</p>
            <Button
              onClick={handleAddClick}
              variant="outline"
              size="sm"
              className="mt-2 transition-colors duration-200 bg-transparent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ürün Ekle
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden border transition-shadow duration-200">
                <CardHeader className="pb-2 bg-muted/20">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                      {product.urunAdi}
                    </CardTitle>
                    <Badge variant="outline" className="font-normal">
                      {product.kategori}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-3 text-sm">
                  <div className="grid grid-cols-2 gap-1">
                    <span className="font-medium text-muted-foreground">Ölçü:</span>
                    <span>{product.olcu}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <span className="font-medium text-muted-foreground">Kilogram:</span>
                    <span className="font-mono">{product.kilogram}</span>
                  </div>
                  {product.notlar && (
                    <div className="mt-3 pt-2 border-t">
                      <span className="font-medium text-muted-foreground block mb-1">Notlar:</span>
                      <p className="text-sm bg-muted/30 p-2 rounded-md">{product.notlar}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-muted/20 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(product)}
                    className="transition-colors duration-200"
                  >
                    <Edit className="h-4 w-4 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProduct(product)}
                    className="transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardFooter>
              </Card>
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl border">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full ${getShelfColor()} flex items-center justify-center text-xs font-bold`}
            >
              {warehouseLayout?.shelves
                .find((shelf) => shelf.id === shelfId)
                ?.name?.substring(0, 2)
                .toUpperCase() || "R"}
            </span>
            Raf Detayları
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeLayer} onValueChange={(value) => setActiveLayer(value as Layer)}>
          <div className="mb-6">
            <div className="w-full bg-muted rounded-lg p-1.5 shadow-sm">
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                {availableLayers.map((layer) => (
                  <button
                    key={layer.value}
                    onClick={() => setActiveLayer(layer.value)}
                    className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium text-sm
              transition-all duration-200 min-w-fit flex-1 sm:flex-none
              ${
                activeLayer === layer.value
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }
            `}
                    style={{
                      minWidth: availableLayers.length <= 3 ? "120px" : availableLayers.length <= 5 ? "100px" : "80px",
                    }}
                  >
                    <Layers className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate font-medium">{layer.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center mt-2">
              <Badge variant="outline" className="text-xs">
                {availableLayers.length} katman mevcut
              </Badge>
            </div>
          </div>

          {availableLayers.map((layer) => (
            <TabsContent key={layer.value} value={layer.value} className="mt-0 animate-fadeIn">
              {renderContent()}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
