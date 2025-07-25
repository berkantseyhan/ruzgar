"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import type { Product, ShelfId, Layer, WarehouseLayout } from "@/lib/redis"
import { getAvailableLayersForShelf } from "@/lib/redis"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, Save, X, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"

interface ProductFormProps {
  initialData?: Partial<Product>
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ProductForm({ initialData, onSuccess, onCancel }: ProductFormProps) {
  const [availableShelves, setAvailableShelves] = useState<{ value: string; label: string }[]>([])
  const [warehouseLayout, setWarehouseLayout] = useState<WarehouseLayout | null>(null)
  const [loadingShelves, setLoadingShelves] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { toast } = useToast()
  const { username } = useAuth()

  // Form state
  const [formData, setFormData] = useState({
    urunAdi: initialData?.urunAdi || "",
    kategori: initialData?.kategori || "",
    olcu: initialData?.olcu || "",
    rafNo: initialData?.rafNo || "",
    katman: initialData?.katman || "",
    kilogram: initialData?.kilogram || 0,
    notlar: initialData?.notlar || "",
  })

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get available layers based on selected shelf
  const getAvailableLayers = (shelfId: string): { value: string; label: string }[] => {
    if (!warehouseLayout) {
      // Fallback to default layers if layout is not loaded
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

    // Use the helper function from redis.ts
    const layers = getAvailableLayersForShelf(shelfId as ShelfId, warehouseLayout)
    return layers.map((layer) => ({
      value: layer,
      label: layer.charAt(0).toUpperCase() + layer.slice(1), // Capitalize first letter
    }))
  }

  // Get current available layers
  const availableLayers = getAvailableLayers(formData.rafNo)

  // Fetch available shelves from layout
  useEffect(() => {
    const fetchShelves = async () => {
      try {
        setLoadingShelves(true)
        const response = await fetch("/api/layout", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache", // Force fresh data
          },
        })
        if (response.ok) {
          const data = await response.json()
          const layout: WarehouseLayout = data.layout
          setWarehouseLayout(layout)

          const shelves = layout.shelves
            .filter((shelf) => shelf.id && shelf.id.trim() !== "") // Filter out empty IDs
            .map((shelf) => ({
              value: shelf.id,
              label: shelf.id,
            }))

          setAvailableShelves(shelves)
          console.log(
            "Loaded shelves:",
            shelves.map((s) => s.label),
          )
        } else {
          // Fallback to default shelves if API fails
          setAvailableShelves([
            { value: "A", label: "A" },
            { value: "B", label: "B" },
            { value: "C", label: "C" },
            { value: "D", label: "D" },
            { value: "E", label: "E" },
            { value: "F", label: "F" },
            { value: "G", label: "G" },
            { value: "orta alan", label: "Orta Alan" },
            { value: "çıkış yolu", label: "Çıkış Yolu" },
          ])
        }
      } catch (error) {
        console.error("Error fetching shelves:", error)
        // Fallback to default shelves
        setAvailableShelves([
          { value: "A", label: "A" },
          { value: "B", label: "B" },
          { value: "C", label: "C" },
          { value: "D", label: "D" },
          { value: "E", label: "E" },
          { value: "F", label: "F" },
          { value: "G", label: "G" },
          { value: "orta alan", label: "Orta Alan" },
          { value: "çıkış yolu", label: "Çıkış Yolu" },
        ])
      } finally {
        setLoadingShelves(false)
      }
    }

    fetchShelves()
  }, [])

  // Effect to reset layer when shelf changes
  useEffect(() => {
    if (formData.rafNo) {
      const layers = getAvailableLayers(formData.rafNo)

      // Check if current layer is valid for the selected shelf
      const isCurrentLayerValid = layers.some((layer) => layer.value === formData.katman)

      // If not valid, reset to the first available layer
      if (!isCurrentLayerValid && layers.length > 0) {
        setFormData((prev) => ({
          ...prev,
          katman: layers[0].value,
        }))
      }
    }
  }, [formData.rafNo, warehouseLayout])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.urunAdi.trim()) newErrors.urunAdi = "Ürün adı gereklidir"
    if (!formData.kategori) newErrors.kategori = "Kategori gereklidir"
    if (!formData.olcu.trim()) newErrors.olcu = "Ölçü gereklidir"

    // Only validate shelf and layer when creating a new product
    if (!initialData?.id) {
      if (!formData.rafNo) newErrors.rafNo = "Raf no gereklidir"
      if (!formData.katman) newErrors.katman = "Katman gereklidir"
    }

    if (formData.kilogram < 0) newErrors.kilogram = "Kilogram 0 veya daha büyük olmalıdır"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "kilogram" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const productData: Product = {
        id: initialData?.id || uuidv4(),
        urunAdi: formData.urunAdi.trim(),
        kategori: formData.kategori,
        olcu: formData.olcu.trim(),
        // When editing, preserve the original shelf and layer values
        rafNo: initialData?.id ? (initialData.rafNo as ShelfId) : (formData.rafNo as ShelfId),
        katman: initialData?.id ? (initialData.katman as Layer) : (formData.katman as Layer),
        kilogram: formData.kilogram,
        notlar: formData.notlar.trim(),
        createdAt: initialData?.createdAt || Date.now(),
      }

      const isUpdate = !!initialData?.id
      console.log(`${isUpdate ? "Updating" : "Creating"} product:`, productData)

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: productData,
          username: username || "Bilinmeyen Kullanıcı",
          isUpdate: isUpdate, // Explicitly pass whether this is an update
        }),
      })

      console.log("Response status:", response.status)

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

      toast({
        title: "Başarılı",
        description: isUpdate ? "Ürün başarıyla güncellendi." : "Ürün başarıyla eklendi.",
      })

      if (onSuccess) {
        onSuccess()
      }

      if (!isUpdate) {
        setFormData({
          urunAdi: "",
          kategori: formData.kategori,
          olcu: "",
          rafNo: formData.rafNo,
          katman: formData.katman,
          kilogram: 0,
          notlar: "",
        })
      }
    } catch (error) {
      console.error("Form submission error:", error)
      setSubmitError(error instanceof Error ? error.message : "Ürün kaydedilirken bir hata oluştu")
      toast({
        title: "Hata",
        description: "Ürün kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getShelfColor = (shelfId: string) => {
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

  return (
    <Card className="w-full shadow-md border">
      <CardHeader className="bg-muted/20 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            {initialData?.id ? (
              <>
                <span>Ürün Düzenle</span>
                <Badge variant="outline" className="font-normal">
                  {initialData.urunAdi}
                </Badge>
              </>
            ) : (
              "Yeni Ürün Ekle"
            )}
          </CardTitle>
          {formData.rafNo && (
            <Badge className={`${getShelfColor(formData.rafNo)} font-normal`}>
              {formData.rafNo} - {formData.katman}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {submitError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="urunAdi" className="font-medium">
                Ürün Adı
              </Label>
              <Input
                id="urunAdi"
                name="urunAdi"
                placeholder="Ürün adı girin"
                value={formData.urunAdi}
                onChange={handleChange}
                className="shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {errors.urunAdi && <p className="text-sm text-destructive mt-1">{errors.urunAdi}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="kategori" className="font-medium">
                Kategori
              </Label>
              <Select
                value={formData.kategori || undefined}
                onValueChange={(value) => handleSelectChange("kategori", value)}
              >
                <SelectTrigger id="kategori" className="shadow-sm focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pul">Pul</SelectItem>
                  <SelectItem value="vida">Vida</SelectItem>
                  <SelectItem value="somun">Somun</SelectItem>
                  <SelectItem value="civata">Civata</SelectItem>
                  <SelectItem value="saplama">Saplama</SelectItem>
                  <SelectItem value="diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
              {errors.kategori && <p className="text-sm text-destructive mt-1">{errors.kategori}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="olcu" className="font-medium">
                Ölçü
              </Label>
              <Input
                id="olcu"
                name="olcu"
                placeholder="Ölçü girin"
                value={formData.olcu}
                onChange={handleChange}
                className="shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {errors.olcu && <p className="text-sm text-destructive mt-1">{errors.olcu}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="kilogram" className="font-medium">
                Kilogram
              </Label>
              <Input
                id="kilogram"
                name="kilogram"
                type="number"
                min="0"
                step="0.01"
                placeholder="Kilogram girin"
                value={formData.kilogram}
                onChange={handleChange}
                className="shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {errors.kilogram && <p className="text-sm text-destructive mt-1">{errors.kilogram}</p>}
            </div>

            {!initialData?.id ? (
              // Only show these fields when creating a new product
              <>
                <div className="space-y-2">
                  <Label htmlFor="rafNo" className="font-medium">
                    Raf No
                  </Label>
                  <Select
                    value={formData.rafNo || undefined}
                    onValueChange={(value) => handleSelectChange("rafNo", value)}
                  >
                    <SelectTrigger id="rafNo" className="shadow-sm focus:ring-2 focus:ring-primary/20 transition-all">
                      <SelectValue placeholder={loadingShelves ? "Raflar yükleniyor..." : "Raf seçin"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingShelves ? (
                        <div className="p-2 text-sm text-muted-foreground">Raflar yükleniyor...</div>
                      ) : availableShelves.length > 0 ? (
                        availableShelves.map((shelf) => (
                          <SelectItem key={shelf.value} value={shelf.value}>
                            {shelf.label}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">Raf bulunamadı</div>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.rafNo && <p className="text-sm text-destructive mt-1">{errors.rafNo}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="katman" className="font-medium">
                    Katman
                  </Label>
                  <Select
                    value={formData.katman || undefined}
                    onValueChange={(value) => handleSelectChange("katman", value)}
                  >
                    <SelectTrigger id="katman" className="shadow-sm focus:ring-2 focus:ring-primary/20 transition-all">
                      <SelectValue placeholder="Katman seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLayers.length > 0 ? (
                        availableLayers.map((layer) => (
                          <SelectItem key={layer.value} value={layer.value}>
                            {layer.label}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">Önce raf seçin</div>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.katman && <p className="text-sm text-destructive mt-1">{errors.katman}</p>}
                </div>
              </>
            ) : (
              // Show static location info when editing
              <div className="space-y-2 md:col-span-2">
                <Label className="font-medium">Konum</Label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background">
                  <span className="text-sm text-muted-foreground">Raf:</span>
                  <Badge className={`${getShelfColor(formData.rafNo)} font-normal`}>{formData.rafNo}</Badge>
                  <span className="text-sm text-muted-foreground ml-2">Katman:</span>
                  <span className="text-sm">{formData.katman}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notlar" className="font-medium">
              Notlar
            </Label>
            <Textarea
              id="notlar"
              name="notlar"
              placeholder="Ürün hakkında notlar"
              className="min-h-[100px] shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
              value={formData.notlar}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="shadow-sm hover:shadow-md transition-all flex items-center gap-2 bg-transparent"
              >
                <X className="h-4 w-4" />
                İptal
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="shadow-sm hover:shadow-md transition-all bg-primary hover:bg-primary/90 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {initialData?.id ? "Güncelle" : "Kaydet"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
