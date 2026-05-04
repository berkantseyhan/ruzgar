"use client"

import { useState, useRef, useEffect } from "react"
import { X, Plus, Trash2, Printer, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import QRCode from "qrcode"

interface LabelField {
  id: string
  label: string
  value: string
  enabled: boolean
  big?: boolean // show as large headline
}

interface TraceabilityLabelModalProps {
  onClose: () => void
}

function generateTraceNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, "")
  const rand = Math.floor(100000 + Math.random() * 900000).toString()
  return `RC-${date}-${rand}`
}

const DEFAULT_FIELDS: LabelField[] = [
  { id: "urun",     label: "Ürün Adı",   value: "", enabled: true,  big: true  },
  { id: "olcu",     label: "Ölçü",       value: "", enabled: true,  big: false },
  { id: "malzeme",  label: "Malzeme",    value: "", enabled: true,  big: false },
  { id: "kg",       label: "KG",         value: "", enabled: true,  big: false },
  { id: "adet",     label: "Adet",       value: "", enabled: true,  big: false },
  { id: "alici",    label: "Alıcı",      value: "", enabled: false, big: false },
  { id: "siparis",  label: "Sipariş No", value: "", enabled: false, big: false },
  { id: "lot",      label: "Lot",        value: "", enabled: false, big: false },
  { id: "tarih",    label: "Tarih",      value: new Date().toLocaleDateString("tr-TR"), enabled: true, big: false },
  { id: "not",      label: "Not",        value: "", enabled: false, big: false },
]

export default function TraceabilityLabelModal({ onClose }: TraceabilityLabelModalProps) {
  const [traceNo, setTraceNo]     = useState(generateTraceNumber())
  const [fields, setFields]       = useState<LabelField[]>(DEFAULT_FIELDS)
  const [copies, setCopies]       = useState(1)
  const [showFieldMenu, setShowFieldMenu] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState("")
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = qrCanvasRef.current
    if (!canvas) return
    QRCode.toCanvas(canvas, traceNo, {
      width: 300,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }, (err) => {
      if (!err) setQrDataUrl(canvas.toDataURL("image/png"))
    })
  }, [traceNo])

  const regenerate = () => setTraceNo(generateTraceNumber())

  const updateField = (id: string, value: string) =>
    setFields((f) => f.map((field) => (field.id === id ? { ...field, value } : field)))

  const toggleField = (id: string) =>
    setFields((f) => f.map((field) => (field.id === id ? { ...field, enabled: !field.enabled } : field)))

  const enabledFields  = fields.filter((f) => f.enabled)
  const disabledFields = fields.filter((f) => !f.enabled)

  // --- build print HTML ---
  const handlePrint = () => {
    const logoUrl = `${window.location.origin}/ruzgar-civata-logo.png`
    // 100mm at 96dpi = 378px
    const S = 378

    const bigField   = enabledFields.find((f) => f.big && f.value.trim())
    const restFields = enabledFields.filter((f) => !f.big && f.value.trim())
    const dateField  = restFields.find((f) => f.id === "tarih")
    const mainFields = restFields.filter((f) => f.id !== "tarih")

    const mainRows = mainFields.map((f) =>
      `<tr>
        <td style="font-weight:700;font-size:15px;white-space:nowrap;padding:3px 8px 3px 0;vertical-align:top;color:#111;">${f.label}</td>
        <td style="font-size:15px;padding:3px 0;vertical-align:top;color:#111;">${f.value}</td>
       </tr>`
    ).join("")

    const labelHtml = `
<div style="
  width:${S}px;height:${S}px;
  box-sizing:border-box;
  font-family:'Segoe UI',Arial,sans-serif;
  background:#fff;
  display:flex;
  flex-direction:row;
  overflow:hidden;
  position:relative;
">
  <!-- LEFT STRIP: rotated logo -->
  <div style="
    width:52px;
    background:#fff;
    border-right:2px solid #111;
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
    padding:8px 0;
  ">
    <img src="${logoUrl}"
      style="
        width:${S - 80}px;
        height:40px;
        object-fit:contain;
        transform:rotate(-90deg);
        transform-origin:center center;
        display:block;
      "
    />
  </div>

  <!-- MAIN CONTENT -->
  <div style="flex:1;display:flex;flex-direction:column;padding:14px 14px 10px 14px;overflow:hidden;">

    <!-- Big product name -->
    <div style="flex-shrink:0;margin-bottom:10px;border-bottom:2px solid #111;padding-bottom:8px;">
      ${bigField
        ? `<p style="font-size:26px;font-weight:900;color:#111;line-height:1.15;word-break:break-word;margin:0;">${bigField.value}</p>
           <p style="font-size:11px;color:#555;margin:2px 0 0;">${bigField.label}</p>`
        : `<p style="font-size:20px;font-weight:900;color:#bbb;margin:0;">Ürün adı girilmedi</p>`
      }
    </div>

    <!-- Main fields -->
    <div style="flex:1;overflow:hidden;margin-bottom:8px;">
      ${mainRows
        ? `<table style="width:100%;border-collapse:collapse;">${mainRows}</table>`
        : ""
      }
    </div>

    <!-- Bottom row: QR + trace no + date -->
    <div style="display:flex;align-items:flex-end;gap:10px;border-top:1.5px solid #111;padding-top:8px;flex-shrink:0;">
      <img src="${qrDataUrl}" style="width:72px;height:72px;display:block;flex-shrink:0;" />
      <div style="flex:1;overflow:hidden;">
        <p style="font-size:8px;color:#777;margin:0 0 2px;text-transform:uppercase;letter-spacing:0.5px;">Traceability No</p>
        <p style="font-size:9.5px;font-family:'Courier New',monospace;font-weight:700;color:#111;word-break:break-all;line-height:1.4;margin:0;">${traceNo}</p>
        ${dateField ? `<p style="font-size:10px;color:#555;margin:4px 0 0;">Üretim tarihi: ${dateField.value}</p>` : ""}
      </div>
    </div>

  </div>
</div>`

    const labelsHtml = Array(copies).fill(labelHtml).join("")
    const win = window.open("", "_blank", "width=520,height=620")
    if (!win) return

    win.document.write(`<!DOCTYPE html>
<html lang="tr"><head>
  <meta charset="UTF-8"/>
  <title>Traceability — ${traceNo}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    @page{size:100mm 100mm;margin:0;}
    html,body{width:${S}px;background:#fff;margin:0;padding:0;}
    @media print{
      *{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      html,body{width:${S}px;margin:0;padding:0;}
    }
  </style>
</head><body>
  ${labelsHtml}
  <script>
    var imgs=document.querySelectorAll('img');
    var total=imgs.length,loaded=0;
    function tryPrint(){loaded++;if(loaded>=total){setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},300);}}
    if(total===0){setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},300);}
    else{imgs.forEach(function(img){if(img.complete&&img.naturalWidth>0){tryPrint();}else{img.onload=tryPrint;img.onerror=tryPrint;}});}
  <\/script>
</body></html>`)
    win.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">Traceability Etiket</h2>
            <p className="text-xs text-muted-foreground mt-0.5">100 × 100 mm — QR kodlu</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* LEFT FORM */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* Trace number */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                Traceability No
              </label>
              <div className="flex gap-2 items-center">
                <div className="flex-1 px-3 py-2 rounded-lg bg-muted/40 border border-border font-mono text-sm text-foreground select-all truncate">
                  {traceNo}
                </div>
                <button
                  onClick={regenerate}
                  className="p-2 rounded-lg bg-muted/40 border border-border hover:border-primary/50 hover:text-primary transition-colors"
                  title="Yeni numara üret"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Fields */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
                Alanlar
              </label>
              <div className="space-y-2">
                {enabledFields.map((field) => (
                  <div key={field.id} className="flex gap-2 items-center group">
                    <label className="w-24 shrink-0 text-xs text-muted-foreground leading-tight">
                      {field.label}
                      {field.big && (
                        <span className="ml-1 text-[9px] bg-primary/15 text-primary px-1 rounded">Ana Başlık</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      placeholder={`${field.label}...`}
                      className="flex-1 text-xs px-3 py-2 rounded-lg bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                    <button
                      onClick={() => toggleField(field.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
                      title="Kaldır"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add field */}
            {disabledFields.length > 0 && (
              <div>
                <button
                  onClick={() => setShowFieldMenu((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Alan Ekle
                  {showFieldMenu ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {showFieldMenu && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {disabledFields.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => { toggleField(f.id); setShowFieldMenu(false) }}
                        className="px-2.5 py-1 rounded-full text-xs border border-border bg-muted/30 hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        + {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Copies */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                Kopya Sayısı
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCopies((c) => Math.max(1, c - 1))}
                  className="w-8 h-8 rounded-lg border border-border bg-muted/40 hover:bg-muted flex items-center justify-center text-base font-bold transition-colors"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold">{copies}</span>
                <button
                  onClick={() => setCopies((c) => Math.min(20, c + 1))}
                  className="w-8 h-8 rounded-lg border border-border bg-muted/40 hover:bg-muted flex items-center justify-center text-base font-bold transition-colors"
                >
                  +
                </button>
                <span className="text-xs text-muted-foreground ml-1">adet</span>
              </div>
            </div>
          </div>

          {/* RIGHT PREVIEW */}
          <div className="w-64 shrink-0 border-l border-border bg-muted/10 px-4 py-4 flex flex-col items-center gap-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Önizleme</p>

            {/* Preview card mimics the print layout */}
            <div
              className="w-full bg-white rounded border-2 border-border shadow overflow-hidden text-black flex flex-row"
              style={{ aspectRatio: "1 / 1" }}
            >
              {/* Left strip */}
              <div className="flex items-center justify-center flex-shrink-0 border-r-2 border-black"
                style={{ width: "14%" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ruzgar-civata-logo.png"
                  alt="Rüzgar Civata"
                  style={{
                    width: "80px",
                    height: "10px",
                    objectFit: "contain",
                    transform: "rotate(-90deg)",
                  }}
                />
              </div>

              {/* Main */}
              <div className="flex-1 flex flex-col p-1.5 overflow-hidden">
                {/* Big title */}
                <div className="border-b-2 border-black pb-1 mb-1 flex-shrink-0">
                  {enabledFields.find((f) => f.big && f.value.trim()) ? (
                    <p className="font-black leading-tight break-words" style={{ fontSize: "8px" }}>
                      {enabledFields.find((f) => f.big)?.value}
                    </p>
                  ) : (
                    <p className="text-gray-300 font-bold" style={{ fontSize: "7px" }}>Ürün adı...</p>
                  )}
                </div>

                {/* Rest fields */}
                <div className="flex-1 overflow-hidden mb-1">
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {enabledFields.filter((f) => !f.big && f.id !== "tarih" && f.value.trim()).map((f) => (
                        <tr key={f.id}>
                          <td className="font-bold text-gray-700 pr-1 whitespace-nowrap" style={{ fontSize: "5px", width: "40%" }}>{f.label}</td>
                          <td className="text-gray-900" style={{ fontSize: "5px" }}>{f.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* QR + trace no */}
                <div className="border-t-2 border-black pt-1 flex items-end gap-1 flex-shrink-0">
                  <canvas
                    ref={qrCanvasRef}
                    style={{ width: "22px", height: "22px", flexShrink: 0 }}
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-mono font-bold leading-tight break-all" style={{ fontSize: "3.5px" }}>{traceNo}</p>
                    {enabledFields.find((f) => f.id === "tarih" && f.value) && (
                      <p className="text-gray-500 mt-0.5" style={{ fontSize: "3.5px" }}>
                        Tarih: {enabledFields.find((f) => f.id === "tarih")?.value}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-muted-foreground text-center leading-relaxed">
              Logo solda dikey, ürün adı büyük, QR sol altta
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-background">
          <Button variant="outline" size="sm" onClick={onClose}>Kapat</Button>
          <Button onClick={handlePrint} className="flex items-center gap-2 bg-primary">
            <Printer className="h-4 w-4" />
            {copies > 1 ? `${copies} Etiket Yazdır` : "Yazdır / PDF"}
          </Button>
        </div>
      </div>
    </div>
  )
}
