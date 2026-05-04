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
  { id: "urun",    label: "Ürün Adı",  value: "",  enabled: true  },
  { id: "olcu",    label: "Ölçü",      value: "",  enabled: true  },
  { id: "malzeme", label: "Malzeme",   value: "",  enabled: true  },
  { id: "kg",      label: "KG",        value: "",  enabled: true  },
  { id: "adet",    label: "Adet",      value: "",  enabled: true  },
  { id: "alici",   label: "Alıcı",     value: "",  enabled: false },
  { id: "tarih",   label: "Tarih",     value: new Date().toLocaleDateString("tr-TR"), enabled: true },
  { id: "not",     label: "Not",       value: "",  enabled: false },
]

export default function TraceabilityLabelModal({ onClose }: TraceabilityLabelModalProps) {
  const [traceNo, setTraceNo] = useState(generateTraceNumber())
  const [fields, setFields] = useState<LabelField[]>(DEFAULT_FIELDS)
  const [copies, setCopies] = useState(1)
  const [showFieldMenu, setShowFieldMenu] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState("")
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  // Render QR code to canvas and also capture data URL for print
  useEffect(() => {
    const canvas = qrCanvasRef.current
    if (!canvas) return
    QRCode.toCanvas(canvas, traceNo, {
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }, (err) => {
      if (!err) {
        setQrDataUrl(canvas.toDataURL("image/png"))
      }
    })
  }, [traceNo])

  const regenerate = () => setTraceNo(generateTraceNumber())
  const updateField = (id: string, value: string) =>
    setFields((f) => f.map((field) => (field.id === id ? { ...field, value } : field)))
  const toggleField = (id: string) =>
    setFields((f) => f.map((field) => (field.id === id ? { ...field, enabled: !field.enabled } : field)))

  const enabledFields = fields.filter((f) => f.enabled)
  const disabledFields = fields.filter((f) => !f.enabled)
  const filledFields = enabledFields.filter((f) => f.value.trim())

  const handlePrint = () => {
    const logoUrl = `${window.location.origin}/ruzgar-civata-logo.png`
    // 100mm @ 96dpi = 378px
    const PX = 378

    const rowsHtml = filledFields
      .map(
        (f) => `
        <tr>
          <td style="font-weight:700;color:#111;width:40%;padding:4px 6px 4px 0;font-size:15px;white-space:nowrap;vertical-align:top;border-bottom:1px solid #f3f4f6;">${f.label}</td>
          <td style="color:#111;padding:4px 0;font-size:15px;vertical-align:top;border-bottom:1px solid #f3f4f6;">${f.value}</td>
        </tr>`,
      )
      .join("")

    const labelHtml = `
      <div style="
        width:${PX}px;height:${PX}px;
        padding:14px 16px 12px 16px;
        box-sizing:border-box;
        font-family:'Segoe UI',Arial,sans-serif;
        background:#fff;
        display:flex;
        flex-direction:column;
        overflow:hidden;
      ">
        <!-- Logo row -->
        <div style="display:flex;align-items:center;justify-content:center;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:8px;flex-shrink:0;">
          <img src="${logoUrl}" style="height:72px;max-width:${PX - 32}px;object-fit:contain;" />
        </div>

        <!-- QR + Trace no row -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;flex-shrink:0;">
          <div style="flex-shrink:0;">
            <img src="${qrDataUrl}" style="width:90px;height:90px;display:block;" />
          </div>
          <div style="flex:1;overflow:hidden;">
            <p style="font-size:9px;color:#888;margin:0 0 3px;text-transform:uppercase;letter-spacing:0.5px;">Traceability No</p>
            <p style="font-size:11px;font-family:'Courier New',monospace;color:#111;font-weight:700;word-break:break-all;line-height:1.4;">${traceNo}</p>
          </div>
        </div>

        <!-- Divider -->
        <div style="border-top:1.5px solid #111;margin-bottom:7px;flex-shrink:0;"></div>

        <!-- Fields table -->
        <div style="flex:1;overflow:hidden;">
          ${
            rowsHtml
              ? `<table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>`
              : `<p style="font-size:13px;color:#9ca3af;text-align:center;margin:10px 0;">Alan bilgisi girilmedi</p>`
          }
        </div>

        <!-- Footer -->
        <div style="border-top:1px solid #d1d5db;padding-top:5px;text-align:center;flex-shrink:0;margin-top:auto;">
          <p style="font-size:10px;color:#6b7280;margin:0;letter-spacing:0.5px;font-weight:600;">RÜZGAR CIVATA BAĞLANTI ELEMANLARI</p>
        </div>
      </div>
    `

    const labelsHtml = Array(copies).fill(labelHtml).join("")
    const win = window.open("", "_blank", "width=520,height=620")
    if (!win) return

    win.document.write(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8"/>
  <title>Traceability — ${traceNo}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    @page{size:100mm 100mm;margin:0;}
    html,body{width:${PX}px;background:#fff;margin:0;padding:0;}
    body{display:block;}
    @media print{
      *{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      html,body{width:${PX}px;margin:0;padding:0;}
    }
  </style>
</head>
<body>
  ${labelsHtml}
  <script>
    var imgs = document.querySelectorAll('img');
    var total = imgs.length; var loaded = 0;
    function tryPrint(){ loaded++; if(loaded>=total){ setTimeout(function(){ window.print(); window.onafterprint=function(){window.close();}; },300); } }
    if(total===0){ setTimeout(function(){ window.print(); window.onafterprint=function(){window.close();}; },300); }
    else{ imgs.forEach(function(img){ if(img.complete&&img.naturalWidth>0){tryPrint();}else{img.onload=tryPrint;img.onerror=tryPrint;} }); }
  <\/script>
</body>
</html>`)
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
          {/* LEFT — Form */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* Trace number */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                Traceability No
              </label>
              <div className="flex gap-2 items-center">
                <div className="flex-1 px-3 py-2 rounded-lg bg-muted/40 border border-border font-mono text-sm text-foreground select-all">
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
              <p className="text-[10px] text-muted-foreground mt-1">Otomatik üretilir. Yenilemek için yenile ikonuna tıkla.</p>
            </div>

            {/* Enabled fields */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
                Alanlar
              </label>
              <div className="space-y-2">
                {enabledFields.map((field) => (
                  <div key={field.id} className="flex gap-2 items-center group">
                    <label className="w-20 shrink-0 text-xs text-muted-foreground">{field.label}</label>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      placeholder={`${field.label} girin...`}
                      className="flex-1 text-xs px-3 py-2 rounded-lg bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                    <button
                      onClick={() => toggleField(field.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
                      title="Alanı kaldır"
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
                  className="w-8 h-8 rounded-lg border border-border bg-muted/40 hover:bg-muted flex items-center justify-center text-lg font-bold transition-colors"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold">{copies}</span>
                <button
                  onClick={() => setCopies((c) => Math.min(20, c + 1))}
                  className="w-8 h-8 rounded-lg border border-border bg-muted/40 hover:bg-muted flex items-center justify-center text-lg font-bold transition-colors"
                >
                  +
                </button>
                <span className="text-xs text-muted-foreground ml-1">adet</span>
              </div>
            </div>
          </div>

          {/* RIGHT — Preview */}
          <div className="w-60 shrink-0 border-l border-border bg-muted/10 px-4 py-4 flex flex-col items-center gap-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Önizleme (100×100mm)</p>

            <div className="w-full aspect-square bg-white rounded-lg border-2 border-border shadow overflow-hidden flex flex-col p-2 text-black">
              {/* Logo */}
              <div className="flex justify-center pb-1 border-b-2 border-black mb-1 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ruzgar-civata-logo.png"
                  alt="Rüzgar Civata"
                  className="h-8 object-contain"
                />
              </div>

              {/* QR + trace no */}
              <div className="flex items-center gap-1.5 mb-1 flex-shrink-0">
                <canvas
                  ref={qrCanvasRef}
                  className="shrink-0"
                  style={{ width: "44px", height: "44px" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-bold leading-tight break-all" style={{ fontSize: "5px" }}>{traceNo}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-black mb-1 flex-shrink-0" />

              {/* Fields */}
              <div className="flex-1 overflow-hidden">
                <table className="w-full" style={{ borderCollapse: "collapse", fontSize: "5.5px" }}>
                  <tbody>
                    {enabledFields.filter((f) => f.value.trim()).map((f) => (
                      <tr key={f.id}>
                        <td className="font-bold pr-1 whitespace-nowrap text-gray-700" style={{ width: "40%" }}>{f.label}</td>
                        <td className="text-gray-900">{f.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-300 pt-0.5 mt-auto text-center flex-shrink-0" style={{ fontSize: "4px" }}>
                <span className="text-gray-500 font-semibold">RÜZGAR CIVATA BAĞLANTI ELEMANLARI</span>
              </div>
            </div>

            <p className="text-[9px] text-muted-foreground text-center leading-relaxed">
              QR kod traceability numarasını içerir
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-3 bg-background">
          <Button variant="outline" size="sm" onClick={onClose}>
            Kapat
          </Button>
          <Button onClick={handlePrint} className="flex items-center gap-2 bg-primary">
            <Printer className="h-4 w-4" />
            {copies > 1 ? `${copies} Etiket Yazdır` : "Yazdır / PDF"}
          </Button>
        </div>
      </div>
    </div>
  )
}
