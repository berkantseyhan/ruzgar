"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Trash2 } from "lucide-react"

interface WorkOrderModalProps {
  open: boolean
  onClose: () => void
}

interface WorkOrderForm {
  workOrderNo: string
  product: string
  productSize: string
  customer: string
  orderNo: string
  notes: string
}

export default function WorkOrderModal({ open, onClose }: WorkOrderModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<WorkOrderForm>({
    workOrderNo: "",
    product: "",
    productSize: "",
    customer: "",
    orderNo: "",
    notes: "",
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  // Canvas drawing setup
  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Fill with white background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add border
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, canvas.width, canvas.height)
  }, [open])

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#000000"
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
    setHasSignature(true)
  }

  const handleCanvasMouseUp = () => {
    setIsDrawing(false)
  }

  const handleCanvasMouseLeave = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, canvas.width, canvas.height)

    setHasSignature(false)
  }

  const handleInputChange = (field: keyof WorkOrderForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    // Validate required fields
    if (!form.workOrderNo.trim()) {
      toast({
        title: "Hata",
        description: "İş Emri No zorunludur",
        variant: "destructive",
      })
      return
    }

    if (!hasSignature) {
      toast({
        title: "Hata",
        description: "Lütfen imza atınız",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Get signature as data URL
      const canvas = canvasRef.current
      const signatureData = canvas?.toDataURL("image/png")

      const payload = {
        ...form,
        signature: signatureData,
        createdAt: new Date().toISOString(),
      }

      const response = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("İş emri kaydedilemedi")
      }

      toast({
        title: "Başarılı",
        description: "İş emri başarıyla kaydedildi",
      })

      // Reset form
      setForm({
        workOrderNo: "",
        product: "",
        productSize: "",
        customer: "",
        orderNo: "",
        notes: "",
      })
      clearSignature()
      onClose()
    } catch (error) {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni İş Emri Oluştur</DialogTitle>
          <DialogDescription>
            İş emri bilgilerini doldurun ve imzayı atın
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 2-Column Grid Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workOrderNo" className="text-xs font-semibold">
                İş Emri No *
              </Label>
              <Input
                id="workOrderNo"
                placeholder="Örn: WO-2026-001"
                value={form.workOrderNo}
                onChange={(e) => handleInputChange("workOrderNo", e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product" className="text-xs font-semibold">
                Ürün
              </Label>
              <Input
                id="product"
                placeholder="Ürün adı"
                value={form.product}
                onChange={(e) => handleInputChange("product", e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productSize" className="text-xs font-semibold">
                Ürün Ölçüleri
              </Label>
              <Input
                id="productSize"
                placeholder="Örn: 10x20x30 mm"
                value={form.productSize}
                onChange={(e) => handleInputChange("productSize", e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer" className="text-xs font-semibold">
                Müşteri
              </Label>
              <Input
                id="customer"
                placeholder="Müşteri adı"
                value={form.customer}
                onChange={(e) => handleInputChange("customer", e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="orderNo" className="text-xs font-semibold">
                Sipariş Numarası
              </Label>
              <Input
                id="orderNo"
                placeholder="Sipariş numarası"
                value={form.orderNo}
                onChange={(e) => handleInputChange("orderNo", e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-semibold">
              Notlar
            </Label>
            <Textarea
              id="notes"
              placeholder="İş emriyle ilgili notlar..."
              value={form.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="text-sm min-h-20 resize-none"
            />
          </div>

          {/* Signature Area */}
          <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Onaylayan İmzası *</Label>
              {hasSignature && (
                <button
                  onClick={clearSignature}
                  className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Temizle
                </button>
              )}
            </div>
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseLeave}
              className="w-full h-32 border-2 border-dashed border-border rounded-lg cursor-crosshair bg-white hover:bg-muted/5 transition-colors"
            />
            <p className="text-xs text-muted-foreground">
              Fare veya dokunmatik ekran ile imza atın
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            İptal
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? "Kaydediliyor..." : "İş Emrini Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
