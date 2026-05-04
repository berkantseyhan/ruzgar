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
  const qrPreviewRef = useRef<HTMLCanvasElement>(null)  // small preview canvas
  const qrPrintRef  = useRef<HTMLCanvasElement>(null)   // large print canvas (hidden)

  useEffect(() => {
    // Render small version for preview (56px)
    const previewCanvas = qrPreviewRef.current
    if (previewCanvas) {
      QRCode.toCanvas(previewCanvas, traceNo, {
        width: 56,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "M",
      })
    }
    // Render large version for print data URL (300px)
    const printCanvas = qrPrintRef.current
    if (printCanvas) {
      QRCode.toCanvas(printCanvas, traceNo, {
        width: 300,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "M",
      }, (err) => {
        if (!err) setQrDataUrl(printCanvas.toDataURL("image/png"))
      })
    }
  }, [traceNo])

  const regenerate = () => setTraceNo(generateTraceNumber())

  const updateField = (id: string, value: string) =>
    setFields((f) => f.map((field) => (field.id === id ? { ...field, value } : field)))

  const toggleField = (id: string) =>
    setFields((f) => f.map((field) => (field.id === id ? { ...field, enabled: !field.enabled } : field)))

  const enabledFields  = fields.filter((f) => f.enabled)
  const disabledFields = fields.filter((f) => !f.enabled)

  // --- build print HTML ---
  // Zebra GC420t: 203 DPI thermal. Rules:
  //  • NO dark backgrounds — thermal can't print solid fills reliably
  //  • ALL text pure #000000, NO greys
  //  • Min font-size 14px, font-weight >= 700
  //  • Borders min 2px solid black
  //  • Logo on WHITE background, siyah saf (transparent PNG is fine)
  const handlePrint = () => {
    const logoUrl = `${window.location.origin}/ruzgar-civata-logo.png`
    // 100mm @ 96dpi = 378px
    const S = 378

    const bigField   = enabledFields.find((f) => f.big && f.value.trim())
    const restFields = enabledFields.filter((f) => !f.big && f.value.trim())
    const dateField  = restFields.find((f) => f.id === "tarih")
    const mainFields = restFields.filter((f) => f.id !== "tarih")

    // Info rows — label left, value right, both pure black bold
    const infoRows = mainFields.map((f) => `
      <tr>
        <td style="font-size:14px;font-weight:700;color:#000;padding:4px 10px 4px 0;white-space:nowrap;vertical-align:top;width:38%;">${f.label}</td>
        <td style="font-size:14px;font-weight:900;color:#000;padding:4px 0;vertical-align:top;">${f.value}</td>
      </tr>`).join("")

    const productFontSize = bigField
      ? (bigField.value.length > 24 ? 18 : bigField.value.length > 16 ? 22 : 26)
      : 18

    const labelHtml = `
<div style="
  width:${S}px;
  min-height:${S}px;
  padding:10px 14px;
  box-sizing:border-box;
  font-family:Arial,Helvetica,sans-serif;
  background:#ffffff;
  display:block;
">

  <!-- ① LOGO -->
  <div style="
    border:3px solid #000;
    padding:4px;
    display:flex;
    align-items:center;
    justify-content:center;
    height:90px;
    margin-bottom:8px;
    overflow:hidden;
  ">
    <img src="${logoUrl}" style="width:100%;height:82px;object-fit:contain;display:block;" />
  </div>

  <!-- ② ÜRÜN ADI -->
  <div style="border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:6px;">
    <div style="font-size:9px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">URUN / PRODUCT</div>
    <div style="font-size:${productFontSize}px;font-weight:900;color:#000;line-height:1.1;word-break:break-word;">
      ${bigField ? bigField.value : "—"}
    </div>
  </div>

  <!-- ③ BİLGİ SATIRLARI — tüm alanlar, hiç kesilmez -->
  ${infoRows
    ? `<table style="width:100%;border-collapse:collapse;margin-bottom:8px;">${infoRows}</table>`
    : ""}

  <!-- ④ FOOTER: QR + trace no + tarih -->
  <div style="
    display:flex;
    align-items:center;
    gap:12px;
    border-top:2px solid #000;
    padding-top:8px;
    margin-top:4px;
  ">
    <img src="${qrDataUrl}" style="width:80px;height:80px;flex-shrink:0;display:block;" />
    <div style="flex:1;">
      <div style="font-size:9px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px;">TRACEABILITY NO</div>
      <div style="font-size:11px;font-family:'Courier New',Courier,monospace;font-weight:700;color:#000;word-break:break-all;line-height:1.4;">${traceNo}</div>
      ${dateField
        ? `<div style="font-size:13px;font-weight:700;color:#000;margin-top:4px;">Tarih: ${dateField.value}</div>`
        : ""}
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
    html,body{width:${S}px;margin:0;padding:0;background:#fff;}
    @media print{
      *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}
      html,body{width:${S}px;margin:0;padding:0;background:#fff;}
    }
  </style>
</head><body>
  ${labelsHtml}
  <script>
    var imgs=document.querySelectorAll('img');
    var total=imgs.length,loaded=0;
    function tryPrint(){
      loaded++;
      if(loaded>=total){setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},400);}
    }
    if(total===0){setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},400);}
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

            {/* Preview — fixed 220x220px so proportions are always correct */}
            <div className="flex justify-center">
              <div
                className="overflow-hidden text-black flex flex-col"
                style={{ width: 220, height: 220, background: "#fff", border: "2px solid #000", padding: "4px 5px", flexShrink: 0 }}
              >
                {/* Logo box — 60px tall out of 220 */}
                <div style={{ border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", height: 60, marginBottom: 4, flexShrink: 0, padding: 2, overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/ruzgar-civata-logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>

                {/* Product name */}
                <div style={{ borderBottom: "1px solid #000", paddingBottom: 2, marginBottom: 2, flexShrink: 0 }}>
                  <div style={{ fontSize: 4, fontWeight: 700, color: "#000", textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 1 }}>URUN / PRODUCT</div>
                  <div style={{ fontSize: 9, fontWeight: 900, color: "#000", lineHeight: 1.1, wordBreak: "break-word" as const }}>
                    {enabledFields.find((f) => f.big)?.value || "—"}
                  </div>
                </div>

                {/* Info rows */}
                <div style={{ flex: 1, overflow: "hidden", marginBottom: 2 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                    <tbody>
                      {enabledFields.filter((f) => !f.big && f.id !== "tarih" && f.value.trim()).map((f) => (
                        <tr key={f.id}>
                          <td style={{ fontSize: 5, fontWeight: 700, color: "#000", paddingRight: 3, whiteSpace: "nowrap" as const, verticalAlign: "top" as const, width: "40%" }}>{f.label}</td>
                          <td style={{ fontSize: 5, fontWeight: 900, color: "#000", verticalAlign: "top" as const }}>{f.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer: QR + trace — preview canvas fixed 56x56 */}
                <div style={{ borderTop: "1px solid #000", paddingTop: 3, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <canvas ref={qrPreviewRef} style={{ width: 56, height: 56, flexShrink: 0 }} />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: 3.5, fontWeight: 700, color: "#000", textTransform: "uppercase" as const, marginBottom: 1 }}>TRACEABILITY NO</div>
                    <div style={{ fontSize: 4, fontFamily: "monospace", fontWeight: 700, color: "#000", wordBreak: "break-all" as const, lineHeight: 1.3 }}>{traceNo}</div>
                    {enabledFields.find((f) => f.id === "tarih" && f.value) && (
                      <div style={{ fontSize: 4, fontWeight: 700, color: "#000", marginTop: 1 }}>
                        Tarih: {enabledFields.find((f) => f.id === "tarih")?.value}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-muted-foreground text-center leading-relaxed">
              Zebra GC420t termal optimize &mdash; saf siyah, min 14px baskı
            </p>
          </div>
        </div>

        {/* Hidden canvas used only to generate print-quality QR data URL */}
        <canvas ref={qrPrintRef} style={{ display: "none" }} />

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
