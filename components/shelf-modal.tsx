"use client"

import { useEffect, useState } from "react"
import type { Layer, Product, ShelfId } from "@/lib/redis"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, Plus, RefreshCw, Loader2, Package, Layers } from "lucide-react"
import ProductForm from "@/components/product-form"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"

interface ShelfModalProps {
  shelfId: ShelfId
  onClose: () => void
}

export default function ShelfModal({ shelfId, onClose }: ShelfModalProps) {
  // Get available layers based on selected shelf
  const getAvailableLayers = (shelfId: ShelfId): { value: Layer; label: string }[] => {
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

  const availableLayers = getAvailableLayers(shelfId)
  const [activeLayer, setActiveLayer] = useState<Layer>(availableLayers[0]?.value || "üst kat")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const { toast } = useToast()
  const { username } = useAuth()

  // Update activeLayer when shelfId changes
  useEffect(() => {
    const layers = getAvailableLayers(shelfId)
    setActiveLayer(layers[0]?.value || "üst kat")
  }, [shelfId])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      // Use a try-catch block to handle network errors
      const encodedLayer = encodeURIComponent(activeLayer)
      const url = `/api/products?shelfId=${shelfId}&layer=${encodedLayer}`
      console.log(`Fetching products from: ${url}`)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      console.log(`Response status: ${response.status}`)

      if (!response.ok) {
        let errorMessage = `Server responded with status: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData && errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          console.error("Failed to parse error response:", e)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log(`Received ${data.products?.length || 0} products`)
      setProducts(data.products || [])
    } catch (err) {
      console.error("Error fetching products:", err)
      setError(err instanceof Error ? err.message : "Ürünler yüklenirken bir hata oluştu")
      toast({
        title: "Hata",
        description: "Ürünler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [shelfId, activeLayer])

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

      if (!response.ok) {
        let errorMessage = `Server responded with status: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData && errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          console.error("Failed to parse error response:", e)
        }
        throw new Error(errorMessage)
      }

      setProducts(products.filter((p) => p.id !== product.id))
      toast({
        title: "Başarılı",
        description: "Ürün başarıyla silindi.",
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Ürün silinirken bir hata oluştu.",
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
    fetchProducts() // Make sure this is called to refresh the product list
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
              {shelfId}
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                {shelfId} Rafı
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{activeLayer}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {error && (
              <Button onClick={fetchProducts} size="sm" variant="outline" className="transition-colors duration-200">
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
              className="mt-2 transition-colors duration-200"
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

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl border">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full ${getShelfColor()} flex items-center justify-center text-xs font-bold`}
            >
              {shelfId}
            </span>
            Raf Detayları
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeLayer} onValueChange={(value) => setActiveLayer(value as Layer)}>
          <TabsList className="grid grid-cols-3 mb-6 rounded-lg overflow-hidden shadow-md">
            {availableLayers.map((layer) => (
              <TabsTrigger
                key={layer.value}
                value={layer.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 py-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4" />
                  {layer.label}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

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
