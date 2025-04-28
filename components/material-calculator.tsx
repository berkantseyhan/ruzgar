"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, RotateCcw, Wind, AlertCircle } from "lucide-react"
import { trackEvent, getClientSessionId } from "@/actions/track-event"
import { useDebounce } from "@/hooks/use-debounce"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Material = {
  name: string
  density: number
}

type ShapeType = "round" | "rectangular"

const materials: Material[] = [
  { name: "Çelik", density: 7.85 },
  { name: "Paslanmaz Çelik", density: 8.0 },
  { name: "Alüminyum", density: 2.7 },
  { name: "Bakır", density: 8.96 },
  { name: "Pirinç", density: 8.4 },
  { name: "Galvanizli Çelik", density: 7.85 },
  { name: "Karbon Çelik", density: 7.85 },
]

export function MaterialCalculator() {
  const [materialDensity, setMaterialDensity] = useState<number>(materials[0].density)
  const [materialName, setMaterialName] = useState<string>(materials[0].name)
  const [materialPrice, setMaterialPrice] = useState<number>(0)
  const [shapeType, setShapeType] = useState<ShapeType>("round")

  // Round shape parameters
  const [outerDiameter, setOuterDiameter] = useState<number>(0)
  const [innerDiameter, setInnerDiameter] = useState<number>(0)
  const [roundThickness, setRoundThickness] = useState<number>(0)

  // Rectangular shape parameters
  const [length, setLength] = useState<number>(0)
  const [width, setWidth] = useState<number>(0)
  const [rectThickness, setRectThickness] = useState<number>(0)

  // Results
  const [weight, setWeight] = useState<number>(0)
  const [cost, setCost] = useState<number>(0)
  const [quantity, setQuantity] = useState<number>(1)

  // Validation
  const [validationError, setValidationError] = useState<string | null>(null)

  // Session ID for tracking
  const [sessionId, setSessionId] = useState<string>("")

  // Debounced values for tracking to avoid too many events
  const debouncedMaterialPrice = useDebounce(materialPrice, 1000)
  const debouncedOuterDiameter = useDebounce(outerDiameter, 1000)
  const debouncedInnerDiameter = useDebounce(innerDiameter, 1000)
  const debouncedRoundThickness = useDebounce(roundThickness, 1000)
  const debouncedLength = useDebounce(length, 1000)
  const debouncedWidth = useDebounce(width, 1000)
  const debouncedRectThickness = useDebounce(rectThickness, 1000)
  const debouncedQuantity = useDebounce(quantity, 1000)

  // Initialize session ID
  useEffect(() => {
    const initSession = async () => {
      // Use client-side session ID generation
      const sid = await getClientSessionId()
      setSessionId(sid)

      // Store in localStorage for persistence
      if (typeof window !== "undefined") {
        const storedId = localStorage.getItem("ruzgar_session_id")
        if (storedId) {
          setSessionId(storedId)
        } else {
          localStorage.setItem("ruzgar_session_id", sid)
        }
      }
    }

    initSession()
  }, [])

  // Validate inputs
  useEffect(() => {
    if (shapeType === "round") {
      if (innerDiameter >= outerDiameter && outerDiameter > 0) {
        setValidationError("İç çap, dış çaptan küçük olmalıdır")
        return
      }
    }
    setValidationError(null)
  }, [shapeType, innerDiameter, outerDiameter])

  // Calculate weight and cost whenever inputs change
  useEffect(() => {
    calculateResults()
  }, [
    materialDensity,
    materialPrice,
    shapeType,
    outerDiameter,
    innerDiameter,
    roundThickness,
    length,
    width,
    rectThickness,
    quantity,
    validationError,
  ])

  // Track material price changes
  useEffect(() => {
    if (sessionId && debouncedMaterialPrice > 0) {
      trackEvent("price_changed", {
        materialType: materialName,
        price: debouncedMaterialPrice,
        sessionId,
      })
    }
  }, [debouncedMaterialPrice, materialName, sessionId])

  // Track quantity changes
  useEffect(() => {
    if (sessionId && debouncedQuantity > 1) {
      trackEvent("quantity_changed", {
        quantity: debouncedQuantity,
        sessionId,
      })
    }
  }, [debouncedQuantity, sessionId])

  // Track dimension changes for round shape
  useEffect(() => {
    if (
      sessionId &&
      shapeType === "round" &&
      (debouncedOuterDiameter > 0 || debouncedInnerDiameter > 0 || debouncedRoundThickness > 0)
    ) {
      trackEvent("dimension_changed", {
        shapeType: "round",
        dimensions: {
          outerDiameter: debouncedOuterDiameter,
          innerDiameter: debouncedInnerDiameter,
          thickness: debouncedRoundThickness,
        },
        sessionId,
      })
    }
  }, [debouncedOuterDiameter, debouncedInnerDiameter, debouncedRoundThickness, shapeType, sessionId])

  // Track dimension changes for rectangular shape
  useEffect(() => {
    if (
      sessionId &&
      shapeType === "rectangular" &&
      (debouncedLength > 0 || debouncedWidth > 0 || debouncedRectThickness > 0)
    ) {
      trackEvent("dimension_changed", {
        shapeType: "rectangular",
        dimensions: {
          length: debouncedLength,
          width: debouncedWidth,
          thickness: debouncedRectThickness,
        },
        sessionId,
      })
    }
  }, [debouncedLength, debouncedWidth, debouncedRectThickness, shapeType, sessionId])

  const calculateResults = () => {
    // If there's a validation error, don't calculate
    if (validationError) {
      setWeight(0)
      setCost(0)
      return
    }

    let calculatedWeight = 0

    if (shapeType === "round") {
      // Weight (kg) = π × ( (Outer Diameter / 2)² - (Inner Diameter / 2)² ) × Thickness × Density ÷ 1,000,000
      if (outerDiameter > 0 && roundThickness > 0) {
        const outerRadius = outerDiameter / 2
        const innerRadius = innerDiameter / 2

        // Check if inner diameter is valid (less than outer diameter)
        if (innerDiameter >= outerDiameter) {
          setWeight(0)
          setCost(0)
          return
        }

        calculatedWeight =
          (Math.PI * (Math.pow(outerRadius, 2) - Math.pow(innerRadius, 2)) * roundThickness * materialDensity) / 1000000
      }
    } else {
      // Weight (kg) = Length × Width × Thickness × Density ÷ 1,000,000
      if (length > 0 && width > 0 && rectThickness > 0) {
        calculatedWeight = (length * width * rectThickness * materialDensity) / 1000000
      }
    }

    // Calculate cost for the total quantity
    const totalWeight = calculatedWeight * quantity
    const calculatedCost = totalWeight * materialPrice

    setWeight(totalWeight)
    setCost(calculatedCost)

    // Track calculation if we have meaningful results
    if (totalWeight > 0 && calculatedCost > 0 && sessionId) {
      trackEvent("calculation_performed", {
        materialType: materialName,
        materialDensity,
        shapeType,
        dimensions:
          shapeType === "round"
            ? { outerDiameter, innerDiameter, thickness: roundThickness }
            : { length, width, thickness: rectThickness },
        price: materialPrice,
        quantity,
        weight: totalWeight,
        cost: calculatedCost,
        sessionId,
      })
    }
  }

  const resetForm = () => {
    setMaterialName(materials[0].name)
    setMaterialDensity(materials[0].density)
    setMaterialPrice(0)
    setShapeType("round")
    setOuterDiameter(0)
    setInnerDiameter(0)
    setRoundThickness(0)
    setLength(0)
    setWidth(0)
    setRectThickness(0)
    setQuantity(1)
    setWeight(0)
    setCost(0)
    setValidationError(null)
  }

  const handleMaterialChange = (value: string) => {
    const selectedMaterial = materials.find((m) => m.name === value)
    if (selectedMaterial) {
      setMaterialName(selectedMaterial.name)
      setMaterialDensity(selectedMaterial.density)

      // Track material selection
      if (sessionId) {
        trackEvent("material_selected", {
          materialType: selectedMaterial.name,
          materialDensity: selectedMaterial.density,
          sessionId,
        })
      }
    }
  }

  const handleShapeChange = (value: ShapeType) => {
    setShapeType(value)

    // Track shape selection
    if (sessionId) {
      trackEvent("shape_selected", {
        shapeType: value,
        sessionId,
      })
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="h-fit border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Giriş Parametreleri
          </CardTitle>
          <CardDescription>Malzeme özellikleri ve boyutları girin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material">Malzeme</Label>
              <Select onValueChange={handleMaterialChange} defaultValue={materials[0].name}>
                <SelectTrigger id="material">
                  <SelectValue placeholder="Malzeme seçin" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.name} value={material.name}>
                      {material.name} ({material.density} g/cm³)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Yoğunluk: {materialDensity} g/cm³</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Malzeme Fiyatı (₺/kg)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={materialPrice || ""}
                onChange={(e) => setMaterialPrice(Number.parseFloat(e.target.value) || 0)}
                placeholder="Kilogram başına fiyat girin"
              />
              <p className="text-xs text-muted-foreground">Malzemenin kilogram başına Türk Lirası cinsinden fiyatı</p>
            </div>

            <div className="space-y-2">
              <Label>Kesim Şekli</Label>
              <Tabs
                defaultValue="round"
                value={shapeType}
                onValueChange={(value) => handleShapeChange(value as ShapeType)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="round">Yuvarlak Pul (Disk)</TabsTrigger>
                  <TabsTrigger value="rectangular">Dikdörtgen Plaka</TabsTrigger>
                </TabsList>
                <TabsContent value="round" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="outerDiameter">Dış Çap (mm)</Label>
                    <Input
                      id="outerDiameter"
                      type="number"
                      min="0"
                      step="0.1"
                      value={outerDiameter || ""}
                      onChange={(e) => setOuterDiameter(Number.parseFloat(e.target.value) || 0)}
                      placeholder="Dış çap girin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="innerDiameter">İç Çap (mm)</Label>
                    <Input
                      id="innerDiameter"
                      type="number"
                      min="0"
                      step="0.1"
                      value={innerDiameter || ""}
                      onChange={(e) => setInnerDiameter(Number.parseFloat(e.target.value) || 0)}
                      placeholder="İç çap girin"
                      className={validationError ? "border-red-500" : ""}
                    />
                    <p className="text-xs text-muted-foreground">Tam disk için 0 kullanın</p>
                    {validationError && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{validationError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roundThickness">Kalınlık (mm)</Label>
                    <Input
                      id="roundThickness"
                      type="number"
                      min="0"
                      step="0.1"
                      value={roundThickness || ""}
                      onChange={(e) => setRoundThickness(Number.parseFloat(e.target.value) || 0)}
                      placeholder="Kalınlık girin"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="rectangular" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="length">Uzunluk (mm)</Label>
                    <Input
                      id="length"
                      type="number"
                      min="0"
                      step="0.1"
                      value={length || ""}
                      onChange={(e) => setLength(Number.parseFloat(e.target.value) || 0)}
                      placeholder="Uzunluk girin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width">Genişlik (mm)</Label>
                    <Input
                      id="width"
                      type="number"
                      min="0"
                      step="0.1"
                      value={width || ""}
                      onChange={(e) => setWidth(Number.parseFloat(e.target.value) || 0)}
                      placeholder="Genişlik girin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rectThickness">Kalınlık (mm)</Label>
                    <Input
                      id="rectThickness"
                      type="number"
                      min="0"
                      step="0.1"
                      value={rectThickness || ""}
                      onChange={(e) => setRectThickness(Number.parseFloat(e.target.value) || 0)}
                      placeholder="Kalınlık girin"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Adet</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={quantity || ""}
                onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                placeholder="Adet girin"
              />
              <p className="text-xs text-muted-foreground">Hesaplanacak parça adedi</p>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={resetForm}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Tümünü Sıfırla
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sonuçlar</CardTitle>
              <CardDescription>Girişlerinize göre hesaplanan ağırlık ve maliyet</CardDescription>
            </div>
            <Wind className="h-8 w-8 text-primary opacity-50" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Toplam Ağırlık</Label>
              <div className="rounded-md border bg-muted/50 p-4">
                <p className="text-2xl font-bold">{weight.toFixed(3)} kg</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {quantity > 1
                  ? `${quantity} adet için toplam ağırlık`
                  : "Malzeme yoğunluğu ve boyutlara göre hesaplanmıştır"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Toplam Maliyet</Label>
              <div className="rounded-md border bg-muted/50 p-4">
                <p className="text-2xl font-bold">{cost.toFixed(2)} ₺</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {quantity > 1 ? `${quantity} adet için toplam maliyet` : "Ağırlık × Kilogram Başına Fiyat"}
              </p>
            </div>

            {quantity > 1 && (
              <div className="space-y-2">
                <Label>Birim Bilgileri</Label>
                <div className="rounded-md border bg-muted/50 p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Birim Ağırlık:</span>
                    <span className="text-sm font-medium">{(weight / quantity).toFixed(3)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Birim Maliyet:</span>
                    <span className="text-sm font-medium">{(cost / quantity).toFixed(2)} ₺</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-md border bg-muted/30 p-4">
            <h3 className="font-medium mb-2">Hesaplama Yöntemi</h3>
            {shapeType === "round" ? (
              <p className="text-sm text-muted-foreground">
                Ağırlık (kg) = π × ( (Dış Çap / 2)² - (İç Çap / 2)² ) × Kalınlık × Yoğunluk ÷ 1.000.000
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ağırlık (kg) = Uzunluk × Genişlik × Kalınlık × Yoğunluk ÷ 1.000.000
              </p>
            )}
          </div>

          <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Rüzgar Cıvata Bağlantı Elemanları</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Bu hesaplama aracı, malzeme ağırlığı ve maliyeti için yaklaşık değerler sağlar. Kesin fiyatlandırma için
              lütfen bizimle iletişime geçin.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
