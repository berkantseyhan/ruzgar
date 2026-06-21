"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Printer, X } from "lucide-react"
import WorkOrdersHistory from "@/components/work-orders-history"

interface WorkOrderModalProps {
  open: boolean
  onClose: () => void
}

interface WorkOrderForm {
  product: string
  productSize: string
  customer: string
  orderNo: string
  material: string
  machine: string
  notes: string
}

export default function WorkOrderModal({ open, onClose }: WorkOrderModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<WorkOrderForm>({
    product: "",
    productSize: "",
    customer: "",
    orderNo: "",
    material: "",
    machine: "",
    notes: "",
  })

  const handleInputChange = (field: keyof WorkOrderForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handlePrint = async () => {
    // Validate required fields
    if (!form.product.trim() || !form.customer.trim()) {
      toast({
        title: "Hata",
        description: "Ürün ve Müşteri alanları zorunludur",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Save to database
      const saveResponse = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!saveResponse.ok) {
        const error = await saveResponse.json()
        throw new Error(error.error || "İş emri kaydedilemedi")
      }

      const { workOrderNo } = await saveResponse.json()

      // Generate print HTML
      const printHtml = generatePrintHTML(form, workOrderNo)

      // Open print window
      const printWindow = window.open("", "_blank", "width=1000,height=1200")
      if (printWindow) {
        printWindow.document.write(printHtml)
        printWindow.document.close()

        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print()
          printWindow.onafterprint = () => {
            printWindow.close()
            toast({
              title: "Başarılı",
              description: `İş Emri ${workOrderNo} kaydedildi ve yazdırıldı`,
            })
            onClose()
            // Reset form
            setForm({
              product: "",
              productSize: "",
              customer: "",
              orderNo: "",
              material: "",
              machine: "",
              notes: "",
            })
          }
        }, 500)
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "İş emri kaydedilemedi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>İş Emri Yönetimi</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="yeni" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="yeni">Yeni İş Emri</TabsTrigger>
            <TabsTrigger value="gecmis">Geçmiş</TabsTrigger>
          </TabsList>

          <TabsContent value="yeni" className="space-y-4">
            <DialogDescription>
              Form verileri A4 formatında yazdırılacak ve otomatik olarak kaydedilecektir
            </DialogDescription>

            <div className="grid grid-cols-2 gap-4">
          {/* Product */}
          <div className="space-y-2">
            <Label htmlFor="product" className="font-semibold">
              Ürün *
            </Label>
            <Input
              id="product"
              placeholder="Ürün adını girin"
              value={form.product}
              onChange={(e) => handleInputChange("product", e.target.value)}
              className="text-base px-4 py-2"
            />
          </div>

          {/* Product Size */}
          <div className="space-y-2">
            <Label htmlFor="productSize" className="font-semibold">
              Ürün Ölçüleri
            </Label>
            <Input
              id="productSize"
              placeholder="Ölçüleri girin (ör: 100x50x20)"
              value={form.productSize}
              onChange={(e) => handleInputChange("productSize", e.target.value)}
              className="text-base px-4 py-2"
            />
          </div>

          {/* Material */}
          <div className="space-y-2">
            <Label htmlFor="material" className="font-semibold">
              Hammadde *
            </Label>
            <Input
              id="material"
              placeholder="Hammadde türünü girin"
              value={form.material}
              onChange={(e) => handleInputChange("material", e.target.value)}
              className="text-base px-4 py-2"
            />
          </div>

          {/* Machine */}
          <div className="space-y-2">
            <Label htmlFor="machine" className="font-semibold">
              Makina *
            </Label>
            <Input
              id="machine"
              placeholder="Makina no/adını girin"
              value={form.machine}
              onChange={(e) => handleInputChange("machine", e.target.value)}
              className="text-base px-4 py-2"
            />
          </div>

          {/* Customer */}
          <div className="space-y-2">
            <Label htmlFor="customer" className="font-semibold">
              Müşteri *
            </Label>
            <Input
              id="customer"
              placeholder="Müşteri adını girin"
              value={form.customer}
              onChange={(e) => handleInputChange("customer", e.target.value)}
              className="text-base px-4 py-2"
            />
          </div>

          {/* Order No */}
          <div className="space-y-2">
            <Label htmlFor="orderNo" className="font-semibold">
              Sipariş Numarası
            </Label>
            <Input
              id="orderNo"
              placeholder="Sipariş no girin"
              value={form.orderNo}
              onChange={(e) => handleInputChange("orderNo", e.target.value)}
              className="text-base px-4 py-2"
            />
          </div>

          {/* Notes - Full Width */}
          <div className="col-span-2 space-y-2">
            <Label htmlFor="notes" className="font-semibold">
              Notlar
            </Label>
            <Textarea
              id="notes"
              placeholder="Ek notlar yazınız..."
              value={form.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="text-base px-4 py-2 min-h-24 resize-none"
            />
          </div>
            </div>

            <DialogFooter className="flex justify-between">
              <Button
                onClick={onClose}
                variant="outline"
                className="gap-2"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
                İptal
              </Button>
              <Button
                onClick={handlePrint}
                disabled={isLoading}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" />
                {isLoading ? "Kaydediliyor..." : "Yazdır"}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="gecmis">
            <WorkOrdersHistory />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function generatePrintHTML(form: WorkOrderForm, workOrderNo: string): string {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>İş Emri - ${workOrderNo}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: white;
    }
    
    @page {
      size: A4;
      margin: 15mm;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
    }
    
    .container {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
      background: white;
      font-size: 13px;
      line-height: 1.6;
    }
    
    .header {
      text-align: center;
      margin-bottom: 25px;
      border-bottom: 2px solid #333;
      padding-bottom: 12px;
    }
    
    .header h1 {
      font-size: 26px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .header p {
      font-size: 12px;
      color: #666;
    }
    
    .work-order-no {
      text-align: right;
      margin-bottom: 20px;
      font-size: 14px;
      font-weight: bold;
    }
    
    .work-order-no span {
      background: #f0f0f0;
      padding: 5px 12px;
      border-radius: 4px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    
    .info-section {
      margin-bottom: 20px;
    }
    
    .info-section-title {
      background: #e8e8e8;
      padding: 8px 12px;
      font-weight: bold;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 10px;
      border-left: 4px solid #1e40af;
    }
    
    .info-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 12px;
    }
    
    .info-row.full {
      grid-template-columns: 1fr;
    }
    
    .info-field {
      border: 1px solid #ddd;
      padding: 8px;
      background: #fafafa;
    }
    
    .info-field label {
      display: block;
      font-weight: bold;
      font-size: 11px;
      color: #333;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    
    .info-field .value {
      font-size: 13px;
      color: #000;
      min-height: 20px;
      word-break: break-word;
    }
    
    .signature-section {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      text-align: center;
    }
    
    .signature-box {
      border-top: 1px solid #333;
      padding-top: 12px;
      font-size: 11px;
      height: 100px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    
    .signature-label {
      font-weight: bold;
      margin-top: 8px;
    }
    
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>İŞ EMRİ</h1>
      <p>Üretim ve İşleme Emri</p>
    </div>
    
    <div class="work-order-no">
      <span>İş Emri No: ${workOrderNo}</span>
    </div>
    
    <div class="info-section">
      <div class="info-section-title">Ürün Bilgileri</div>
      <div class="info-row">
        <div class="info-field">
          <label>Ürün Adı</label>
          <div class="value">${form.product}</div>
        </div>
        <div class="info-field">
          <label>Ürün Ölçüleri</label>
          <div class="value">${form.productSize || "-"}</div>
        </div>
      </div>
      <div class="info-row">
        <div class="info-field">
          <label>Hammadde Türü</label>
          <div class="value">${form.material}</div>
        </div>
        <div class="info-field">
          <label>Makina</label>
          <div class="value">${form.machine}</div>
        </div>
      </div>
    </div>
    
    <div class="info-section">
      <div class="info-section-title">Müşteri ve Sipariş Bilgileri</div>
      <div class="info-row">
        <div class="info-field">
          <label>Müşteri Adı</label>
          <div class="value">${form.customer}</div>
        </div>
        <div class="info-field">
          <label>Sipariş No</label>
          <div class="value">${form.orderNo || "-"}</div>
        </div>
      </div>
    </div>
    
    <div class="info-section">
      <div class="info-section-title">İşlem Notları</div>
      <div class="info-row full">
        <div class="info-field" style="min-height: 60px;">
          <label>Notlar</label>
          <div class="value">${(form.notes || "-").replace(/\n/g, "<br>")}</div>
        </div>
      </div>
    </div>
    
    <div class="info-section" style="margin-top: 40px;">
      <div class="info-section-title">Tarih ve Onay</div>
      <div class="info-row">
        <div class="info-field">
          <label>Tarih</label>
          <div class="value">&nbsp;</div>
        </div>
        <div class="info-field">
          <label>Saat</label>
          <div class="value">&nbsp;</div>
        </div>
      </div>
    </div>
    
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-label">Hazırlayan</div>
      </div>
      <div class="signature-box">
        <div class="signature-label">Onaylayan</div>
      </div>
    </div>
  </div>
</body>
</html>
  `
}
