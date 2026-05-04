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
    // 100mm @ 96dpi ≈ 378px
    const S = 378

    const bigField   = enabledFields.find((f) => f.big && f.value.trim())
    const restFields = enabledFields.filter((f) => !f.big && f.value.trim())
    const dateField  = restFields.find((f) => f.id === "tarih")
    const mainFields = restFields.filter((f) => f.id !== "tarih")

    // Two-column grid cells
    const gridCells = mainFields.map((f) =>
      `<div style="background:#f5f5f5;border-radius:4px;padding:6px 8px;">
        <div style="font-size:9px;font-weight:600;color:#777;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">${f.label}</div>
        <div style="font-size:16px;font-weight:800;color:#111;line-height:1.1;">${f.value}</div>
      </div>`
    ).join("")

    const labelHtml = `
<div style="
  width:${S}px;height:${S}px;
  box-sizing:border-box;
  font-family:'Segoe UI',Arial,Helvetica,sans-serif;
  background:#fff;
  display:flex;
  flex-direction:column;
  overflow:hidden;
">

  <!-- ① HEADER: black strip with white logo -->
  <div style="
    background:#111;
    padding:10px 20px;
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
    height:76px;
  ">
    <img src="${logoUrl}"
      style="height:52px;max-width:320px;object-fit:contain;filter:invert(1) brightness(2);"
    />
  </div>

  <!-- ② BODY -->
  <div style="flex:1;display:flex;flex-direction:column;padding:14px 16px 10px 16px;overflow:hidden;gap:10px;">

    <!-- Ürün Adı -->
    <div style="flex-shrink:0;">
      <div style="font-size:9px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Ürün</div>
      <div style="font-size:${bigField && bigField.value.length > 20 ? "20" : "24"}px;font-weight:900;color:#111;line-height:1.1;word-break:break-word;">
        ${bigField ? bigField.value : '<span style="color:#ccc;">—</span>'}
      </div>
    </div>

    <!-- Divider -->
    <div style="height:2px;background:#111;flex-shrink:0;"></div>

    <!-- Info grid (2 cols) -->
    <div style="
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:6px;
      flex-shrink:0;
    ">
      ${gridCells}
    </div>

    <!-- Spacer -->
    <div style="flex:1;"></div>

    <!-- ③ FOOTER: QR + trace + date -->
    <div style="
      display:flex;
      align-items:center;
      gap:12px;
      border-top:2px solid #111;
      padding-top:10px;
      flex-shrink:0;
    ">
      <img src="${qrDataUrl}" style="width:76px;height:76px;flex-shrink:0;display:block;" />
      <div style="flex:1;overflow:hidden;">
        <div style="font-size:8px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Traceability No</div>
        <div style="font-size:10px;font-family:'Courier New',monospace;font-weight:700;color:#111;word-break:break-all;line-height:1.5;">${traceNo}</div>
        ${dateField
          ? `<div style="font-size:11px;color:#555;margin-top:4px;font-weight:600;">Tarih: ${dateField.value}</div>`
          : ""}
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
    html,body{width:${S}px;margin:0;padding:0;background:#fff;}
    @media print{
      *{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    }
  </style>
</head><body>
  ${labelsHtml}
  <script>
    var imgs=document.querySelectorAll('img');
    var total=imgs.length,loaded=0;
    function tryPrint(){loaded++;if(loaded>=total){setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},350);}}
    if(total===0){setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},350);}
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

            {/* Preview card — matches print layout */}
            <div
              className="w-full shadow-lg overflow-hidden text-black flex flex-col"
              style={{ aspectRatio: "1/1", background: "#fff", border: "1px solid #111" }}
            >
              {/* Header black strip */}
              <div style={{
                background: "#111",
                height: "20%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px 8px",
                flexShrink: 0,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ruzgar-civata-logo.png"
                  alt="Rüzgar Civata"
                  style={{ height: "100%", maxWidth: "90%", objectFit: "contain", filter: "invert(1) brightness(2)" }}
                />
              </div>

              {/* Body */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "4px 5px 3px 5px", gap: "3px", overflow: "hidden" }}>
                {/* Product name */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: "4px", color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: "1px" }}>Ürün</div>
                  <div style={{ fontSize: "9px", fontWeight: 900, color: "#111", lineHeight: 1.1, wordBreak: "break-word" }}>
                    {enabledFields.find((f) => f.big)?.value || <span style={{ color: "#ccc" }}>—</span>}
                  </div>
                </div>
                {/* Divider */}
                <div style={{ height: "1.5px", background: "#111", flexShrink: 0 }} />
                {/* Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", flexShrink: 0 }}>
                  {enabledFields.filter((f) => !f.big && f.id !== "tarih" && f.value.trim()).map((f) => (
                    <div key={f.id} style={{ background: "#f5f5f5", borderRadius: "2px", padding: "2px 3px" }}>
                      <div style={{ fontSize: "3.5px", color: "#888", fontWeight: 600, textTransform: "uppercase" }}>{f.label}</div>
                      <div style={{ fontSize: "6px", fontWeight: 800, color: "#111" }}>{f.value}</div>
                    </div>
                  ))}
                </div>
                {/* Spacer */}
                <div style={{ flex: 1 }} />
                {/* Footer: QR + trace */}
                <div style={{ borderTop: "1.5px solid #111", paddingTop: "3px", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                  <canvas ref={qrCanvasRef} width={64} height={64} style={{ width: 22, height: 22, flexShrink: 0 }} />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: "3px", color: "#999", fontWeight: 600, textTransform: "uppercase", marginBottom: "1px" }}>Traceability No</div>
                    <div style={{ fontSize: "3.5px", fontFamily: "monospace", fontWeight: 700, color: "#111", wordBreak: "break-all", lineHeight: 1.3 }}>{traceNo}</div>
                    {enabledFields.find((f) => f.id === "tarih" && f.value) && (
                      <div style={{ fontSize: "3.5px", color: "#555", marginTop: "1px" }}>
                        Tarih: {enabledFields.find((f) => f.id === "tarih")?.value}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-muted-foreground text-center">
              Siyah header&apos;da logo net, 2 sütun bilgi, alt QR
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
