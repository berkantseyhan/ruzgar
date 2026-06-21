"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Printer, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface WorkOrder {
  id: string
  work_order_no: string
  product: string
  product_size: string
  customer: string
  order_no: string
  material: string
  machine: string
  notes: string
  created_at: string
}

export default function WorkOrdersHistory() {
  const { toast } = useToast()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  const fetchWorkOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/work-orders?limit=50")
      if (!response.ok) throw new Error("İş emirleri alınamadı")
      
      const { workOrders } = await response.json()
      setWorkOrders(workOrders || [])
    } catch (error) {
      console.error("[v0] Error fetching work orders:", error)
      toast({
        title: "Hata",
        description: "İş emirleri yüklenemedi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintWorkOrder = (workOrder: WorkOrder) => {
    const printHtml = generatePrintHTML(workOrder)
    const printWindow = window.open("", "_blank", "width=1000,height=1200")
    if (printWindow) {
      printWindow.document.write(printHtml)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  const handleDeleteWorkOrder = async (id: string) => {
    if (!window.confirm("Bu iş emrini silmek istediğinize emin misiniz?")) {
      return
    }

    try {
      const response = await fetch(`/api/work-orders/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Silme başarısız")

      toast({
        title: "Başarılı",
        description: "İş emri silindi",
      })

      fetchWorkOrders()
    } catch (error) {
      console.error("[v0] Error deleting work order:", error)
      toast({
        title: "Hata",
        description: "İş emri silinemedi",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8">Yükleniyor...</div>
  }

  if (workOrders.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Henüz iş emri bulunmamaktadır.</div>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-background/50 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-background/50">
              <TableHead className="font-semibold">İş Emri No</TableHead>
              <TableHead className="font-semibold">Ürün</TableHead>
              <TableHead className="font-semibold">Hammadde</TableHead>
              <TableHead className="font-semibold">Makina</TableHead>
              <TableHead className="font-semibold">Müşteri</TableHead>
              <TableHead className="font-semibold">Sipariş No</TableHead>
              <TableHead className="font-semibold">Tarih</TableHead>
              <TableHead className="font-semibold text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workOrders.map((order) => (
              <TableRow key={order.id} className="border-border hover:bg-background/70">
                <TableCell className="font-mono text-sm font-semibold text-primary">
                  {order.work_order_no}
                </TableCell>
                <TableCell className="text-sm">{order.product}</TableCell>
                <TableCell className="text-sm">{order.material}</TableCell>
                <TableCell className="text-sm">{order.machine}</TableCell>
                <TableCell className="text-sm">{order.customer}</TableCell>
                <TableCell className="text-sm">{order.order_no || "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {order.date ? `${order.date}${order.time ? " " + order.time : ""}` : new Date(order.created_at).toLocaleDateString("tr-TR")}
                </TableCell>
                <TableCell className="text-right space-x-2 flex justify-end">
                  <Button
                    onClick={() => handlePrintWorkOrder(order)}
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    title="Yazdır"
                  >
                    <Printer className="h-4 w-4" />
                    Yazdır
                  </Button>
                  <Button
                    onClick={() => handleDeleteWorkOrder(order.id)}
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                    Sil
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function generatePrintHTML(workOrder: WorkOrder): string {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>İş Emri - ${workOrder.work_order_no}</title>
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
    
    .container {
      width: 100%;
      max-width: 210mm;
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
      <span>İş Emri No: ${workOrder.work_order_no}</span>
    </div>
    
    <div class="info-section">
      <div class="info-section-title">Ürün Bilgileri</div>
      <div class="info-row">
        <div class="info-field">
          <label>Ürün Adı</label>
          <div class="value">${workOrder.product}</div>
        </div>
        <div class="info-field">
          <label>Ürün Ölçüleri</label>
          <div class="value">${workOrder.product_size || "-"}</div>
        </div>
      </div>
      <div class="info-row">
        <div class="info-field">
          <label>Hammadde Türü</label>
          <div class="value">${workOrder.material}</div>
        </div>
        <div class="info-field">
          <label>Makina</label>
          <div class="value">${workOrder.machine}</div>
        </div>
      </div>
    </div>
    
    <div class="info-section">
      <div class="info-section-title">Müşteri ve Sipariş Bilgileri</div>
      <div class="info-row">
        <div class="info-field">
          <label>Müşteri Adı</label>
          <div class="value">${workOrder.customer}</div>
        </div>
        <div class="info-field">
          <label>Sipariş No</label>
          <div class="value">${workOrder.order_no || "-"}</div>
        </div>
      </div>
    </div>
    
    <div class="info-section">
      <div class="info-section-title">İşlem Notları</div>
      <div class="info-row full">
        <div class="info-field" style="min-height: 60px;">
          <label>Notlar</label>
          <div class="value">${(workOrder.notes || "-").replace(/\n/g, "<br>")}</div>
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
