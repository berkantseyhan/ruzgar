"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Printer, Plus } from "lucide-react"

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

  const handleInputChange = (field: keyof WorkOrderForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handlePrint = () => {
    // Validate required fields
    if (!form.workOrderNo.trim()) {
      toast({
        title: "Hata",
        description: "İş Emri No zorunludur",
        variant: "destructive",
      })
      return
    }

    const printHtml = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>İş Emri - ${form.workOrderNo}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      font-family: 'Arial', sans-serif;
      background: white;
    }
    
    @page {
      size: A4;
      margin: 20mm;
    }
    
    body {
      padding: 20px;
      background: white;
    }
    
    .container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #000;
      padding-bottom: 15px;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: bold;
      color: #000;
      margin-bottom: 5px;
    }
    
    .header p {
      font-size: 12px;
      color: #666;
    }
    
    .content {
      margin-bottom: 20px;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .form-row.full {
      grid-template-columns: 1fr;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
    }
    
    .form-group label {
      font-weight: bold;
      font-size: 11px;
      text-transform: uppercase;
      color: #000;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    
    .form-group input,
    .form-group textarea {
      border: 1px solid #000;
      padding: 10px;
      font-size: 12px;
      font-family: 'Arial', sans-serif;
      border-radius: 0;
    }
    
    .form-group textarea {
      resize: vertical;
      min-height: 80px;
    }
    
    .signature-section {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 30px;
    }
    
    .signature-block {
      text-align: center;
    }
    
    .signature-block .line {
      border-top: 1px solid #000;
      height: 60px;
      margin-bottom: 10px;
    }
    
    .signature-block p {
      font-size: 10px;
      color: #000;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 10px;
      color: #999;
      border-top: 1px solid #ddd;
      padding-top: 15px;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .container {
        margin: 0;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>İŞ EMRİ</h1>
      <p>Üretim Emri Formu</p>
    </div>
    
    <div class="content">
      <div class="form-row">
        <div class="form-group">
          <label>İş Emri No</label>
          <input type="text" value="${form.workOrderNo}" readonly />
        </div>
        <div class="form-group">
          <label>Tarih</label>
          <input type="text" value="${new Date().toLocaleDateString("tr-TR")}" readonly />
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Ürün Adı</label>
          <input type="text" value="${form.product}" readonly />
        </div>
        <div class="form-group">
          <label>Ürün Ölçüleri</label>
          <input type="text" value="${form.productSize}" readonly />
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Müşteri</label>
          <input type="text" value="${form.customer}" readonly />
        </div>
        <div class="form-group">
          <label>Sipariş Numarası</label>
          <input type="text" value="${form.orderNo}" readonly />
        </div>
      </div>
      
      <div class="form-row full">
        <div class="form-group">
          <label>Notlar / Özel Talimatlar</label>
          <textarea readonly>${form.notes}</textarea>
        </div>
      </div>
    </div>
    
    <div class="signature-section">
      <div class="signature-block">
        <div class="line"></div>
        <p>Hazırlayan</p>
      </div>
      <div class="signature-block">
        <div class="line"></div>
        <p>Onaylayan</p>
      </div>
      <div class="signature-block">
        <div class="line"></div>
        <p>Müdür</p>
      </div>
    </div>
    
    <div class="footer">
      <p>Bu belge A4 kağıt üzerine yazdırılmıştır.</p>
    </div>
  </div>
</body>
</html>
    `

    const printWindow = window.open("", "_blank", "width=800,height=600")
    if (!printWindow) {
      toast({
        title: "Hata",
        description: "Yazıcı penceresi açılamadı",
        variant: "destructive",
      })
      return
    }

    printWindow.document.write(printHtml)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 300)
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

    setIsLoading(true)
    try {
      const response = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

      onClose()
    } catch (error) {
      console.error("Hata:", error)
      toast({
        title: "Hata",
        description: "İş emri kaydedilirken hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Yeni İş Emri Oluştur</DialogTitle>
          <DialogDescription className="text-slate-400">
            İş emri bilgilerini giriniz ve yazdırınız
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 2 Column Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* İş Emri No */}
            <div className="space-y-2">
              <Label htmlFor="workOrderNo" className="text-sm font-semibold text-slate-200">
                İş Emri No *
              </Label>
              <Input
                id="workOrderNo"
                placeholder="Ör: WO-2024-001"
                value={form.workOrderNo}
                onChange={(e) => handleInputChange("workOrderNo", e.target.value)}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Ürün Adı */}
            <div className="space-y-2">
              <Label htmlFor="product" className="text-sm font-semibold text-slate-200">
                Ürün Adı
              </Label>
              <Input
                id="product"
                placeholder="Ürün adını giriniz"
                value={form.product}
                onChange={(e) => handleInputChange("product", e.target.value)}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Ürün Ölçüleri */}
            <div className="space-y-2">
              <Label htmlFor="productSize" className="text-sm font-semibold text-slate-200">
                Ürün Ölçüleri
              </Label>
              <Input
                id="productSize"
                placeholder="Ör: 100x50x30 cm"
                value={form.productSize}
                onChange={(e) => handleInputChange("productSize", e.target.value)}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Müşteri */}
            <div className="space-y-2">
              <Label htmlFor="customer" className="text-sm font-semibold text-slate-200">
                Müşteri
              </Label>
              <Input
                id="customer"
                placeholder="Müşteri adını giriniz"
                value={form.customer}
                onChange={(e) => handleInputChange("customer", e.target.value)}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Sipariş Numarası */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="orderNo" className="text-sm font-semibold text-slate-200">
                Sipariş Numarası
              </Label>
              <Input
                id="orderNo"
                placeholder="Sipariş numarasını giriniz"
                value={form.orderNo}
                onChange={(e) => handleInputChange("orderNo", e.target.value)}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Notlar - Full Width */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold text-slate-200">
              Notlar / Özel Talimatlar
            </Label>
            <Textarea
              id="notes"
              placeholder="Üretim ile ilgili özel talimatları ve notları yazınız..."
              value={form.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
            <p className="text-sm text-blue-200">
              💡 İş emrisi yazdırmak için aşağıdaki "Yazdır" butonunu kullanınız. Form A4 kağıda uygun şekilde formatlanmıştır.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Printer className="h-4 w-4" />
            Yazdır
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            {isLoading ? "Kaydediliyor..." : "İş Emrini Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
