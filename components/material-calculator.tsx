"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, RotateCcw } from "lucide-react"

type Material = {
  name: string
  density: number
}

type ShapeType = "round" | "rectangular"

const materials: Material[] = [
  { name: "Steel", density: 7.85 },
  { name: "Stainless Steel", density: 8.0 },
  { name: "Aluminum", density: 2.7 },
  { name: "Copper", density: 8.96 },
  { name: "Brass", density: 8.4 },
]

export function MaterialCalculator() {
  const [materialDensity, setMaterialDensity] = useState<number>(materials[0].density)
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
  ])

  const calculateResults = () => {
    let calculatedWeight = 0

    if (shapeType === "round") {
      // Weight (kg) = π × ( (Outer Diameter / 2)² - (Inner Diameter / 2)² ) × Thickness × Density ÷ 1,000,000
      if (outerDiameter && roundThickness) {
        const outerRadius = outerDiameter / 2
        const innerRadius = innerDiameter / 2
        calculatedWeight =
          (Math.PI * (Math.pow(outerRadius, 2) - Math.pow(innerRadius, 2)) * roundThickness * materialDensity) / 1000000
      }
    } else {
      // Weight (kg) = Length × Width × Thickness × Density ÷ 1,000,000
      if (length && width && rectThickness) {
        calculatedWeight = (length * width * rectThickness * materialDensity) / 1000000
      }
    }

    // Calculate cost
    const calculatedCost = calculatedWeight * materialPrice

    setWeight(calculatedWeight)
    setCost(calculatedCost)
  }

  const resetForm = () => {
    setMaterialDensity(materials[0].density)
    setMaterialPrice(0)
    setShapeType("round")
    setOuterDiameter(0)
    setInnerDiameter(0)
    setRoundThickness(0)
    setLength(0)
    setWidth(0)
    setRectThickness(0)
    setWeight(0)
    setCost(0)
  }

  const handleMaterialChange = (value: string) => {
    const selectedMaterial = materials.find((m) => m.name === value)
    if (selectedMaterial) {
      setMaterialDensity(selectedMaterial.density)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Input Parameters
          </CardTitle>
          <CardDescription>Enter material properties and dimensions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Select onValueChange={handleMaterialChange} defaultValue={materials[0].name}>
                <SelectTrigger id="material">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.name} value={material.name}>
                      {material.name} ({material.density} g/cm³)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Density: {materialDensity} g/cm³</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Material Price (₺/kg)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={materialPrice || ""}
                onChange={(e) => setMaterialPrice(Number.parseFloat(e.target.value) || 0)}
                placeholder="Enter price per kilogram"
              />
              <p className="text-xs text-muted-foreground">Price of material per kilogram in Turkish Lira</p>
            </div>

            <div className="space-y-2">
              <Label>Cut Shape</Label>
              <Tabs defaultValue="round" value={shapeType} onValueChange={(value) => setShapeType(value as ShapeType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="round">Round Pul (Disk)</TabsTrigger>
                  <TabsTrigger value="rectangular">Rectangular Plate</TabsTrigger>
                </TabsList>
                <TabsContent value="round" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="outerDiameter">Outer Diameter (mm)</Label>
                    <Input
                      id="outerDiameter"
                      type="number"
                      min="0"
                      step="0.1"
                      value={outerDiameter || ""}
                      onChange={(e) => setOuterDiameter(Number.parseFloat(e.target.value) || 0)}
                      placeholder="Enter outer diameter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="innerDiameter">Inner Diameter (mm)</Label>
                    <Input
                      id="innerDiameter"
                      type="number"
                      min="0"
                      step="0.1"
                      value={innerDiameter || ""}
                      onChange={(e) => setInnerDiameter(Number.parseFloat(e.target.value) || 0)}
                      placeholder="Enter inner diameter"
                    />
                    <p className="text-xs text-muted-foreground">Use 0 for solid disk</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roundThickness">Thickness (mm)</Label>
                    <Input
                      id="roundThickness"
                      type="number"
                      min="0"
                      step="0.1"
                      value={roundThickness || ""}
                      onChange={(e) => setRoundThickness(Number.parseFloat(e.target.value) || 0)}
                      placeholder="Enter thickness"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="rectangular" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="length">Length (mm)</Label>
                    <Input
                      id="length"
                      type="number"
                      min="0"
                      step="0.1"
                      value={length || ""}
                      onChange={(e) => setLength(Number.parseFloat(e.target.value) || 0)}
                      placeholder="Enter length"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (mm)</Label>
                    <Input
                      id="width"
                      type="number"
                      min="0"
                      step="0.1"
                      value={width || ""}
                      onChange={(e) => setWidth(Number.parseFloat(e.target.value) || 0)}
                      placeholder="Enter width"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rectThickness">Thickness (mm)</Label>
                    <Input
                      id="rectThickness"
                      type="number"
                      min="0"
                      step="0.1"
                      value={rectThickness || ""}
                      onChange={(e) => setRectThickness(Number.parseFloat(e.target.value) || 0)}
                      placeholder="Enter thickness"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={resetForm}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset All
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>Calculated weight and cost based on your inputs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cut Material Weight</Label>
              <div className="rounded-md border bg-muted/50 p-4">
                <p className="text-2xl font-bold">{weight.toFixed(3)} kg</p>
              </div>
              <p className="text-xs text-muted-foreground">Calculated based on material density and dimensions</p>
            </div>

            <div className="space-y-2">
              <Label>Total Cost</Label>
              <div className="rounded-md border bg-muted/50 p-4">
                <p className="text-2xl font-bold">₺ {cost.toFixed(2)}</p>
              </div>
              <p className="text-xs text-muted-foreground">Weight × Price per Kilogram</p>
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-4">
            <h3 className="font-medium mb-2">Calculation Method</h3>
            {shapeType === "round" ? (
              <p className="text-sm text-muted-foreground">
                Weight (kg) = π × ( (Outer Diameter / 2)² - (Inner Diameter / 2)² ) × Thickness × Density ÷ 1,000,000
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Weight (kg) = Length × Width × Thickness × Density ÷ 1,000,000
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
