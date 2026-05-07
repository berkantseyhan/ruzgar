"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { X, Plus, Trash2, Printer, RefreshCw, ChevronDown, ChevronUp, History, Tag, ChevronRight, Search, AlertCircle, CheckCircle2, Save, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import QRCode from "qrcode"
import { supabase, TABLES } from "@/lib/supabase"
import type { TraceabilityLabel } from "@/lib/supabase"

interface LabelField {
  id: string
  label: string
  value: string
  enabled: boolean
  big?: boolean
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const DEFAULT_FIELDS: LabelField[] = [
  { id: "urun",     label: "Ürün Adı",   value: "", enabled: true,  big: true  },
  { id: "olcu",     label: "Ölçü",       value: "", enabled: true,  big: false },
  { id: "malzeme",  label: "Malzeme",    value: "", enabled: true,  big: false },
  { id: "kg",       label: "KG",         value: "", enabled: true,  big: false },
  { id: "adet",     label: "Adet",       value: "", enabled: true,  big: false },
  { id: "siparis",  label: "Sipariş No", value: "", enabled: false, big: false },
  { id: "lot",      label: "Lot",        value: "", enabled: false, big: false },
  { id: "tarih",    label: "Tarih",      value: new Date().toLocaleDateString("tr-TR"), enabled: true, big: false },
  { id: "not",      label: "Not",        value: "", enabled: false, big: false },
]

// ─── History Row ──────────────────────────────────────────────────────────────
function HistoryRow({
  record,
  onSave,
  onDelete,
}: {
  record: TraceabilityLabel
  onSave: (id: string, patch: Partial<TraceabilityLabel>) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [form, setForm] = useState({
    hammadde:           record.hammadde           ?? "",
    hammadde_lot:       record.hammadde_lot       ?? "",
    hammadde_tedarikci: record.hammadde_tedarikci ?? "",
    alici:              record.alici              ?? "",
    alici_siparis_no:   record.alici_siparis_no   ?? "",
    sevkiyat_tarihi:    record.sevkiyat_tarihi    ?? "",
    notlar:             record.notlar             ?? "",
  })

  const isComplete = !!(form.hammadde.trim() && form.alici.trim())

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await onDelete(record.id)
    setDeleting(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus("idle")
    const ok = await onSave(record.id, form)
    setSaving(false)
    setSaveStatus(ok ? "success" : "error")
    if (ok) setTimeout(() => setSaveStatus("idle"), 3000)
  }

  const urunAdi = (record.fields as any)?.urun || "—"

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Row header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-foreground truncate">{urunAdi}</span>
            {isComplete ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                <CheckCircle2 className="h-3 w-3" /> Tam
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                <AlertCircle className="h-3 w-3" /> Eksik
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="font-mono">{record.trace_no}</span>
            <span>{formatDate(record.printed_at)}</span>
            <span>{record.copies} adet basım</span>
          </div>
        </div>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-90" : ""}`} />
      </button>

      {/* Delete controls — shown outside the accordion toggle */}
      {open && (
        <div className="flex items-center justify-end gap-2 px-4 py-1.5 bg-red-500/5 border-t border-red-500/10">
          {confirmDelete ? (
            <>
              <span className="text-[11px] text-red-500 font-medium">Emin misiniz? Bu işlem geri alınamaz.</span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
              >
                Vazgeç
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                {deleting ? "Siliniyor..." : "Evet, sil"}
              </button>
            </>
          ) : (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Kaydı sil
            </button>
          )}
        </div>
      )}

      {/* Expanded form */}
      {open && (
        <div className="border-t border-border px-4 py-4 bg-muted/5 space-y-4">
          {/* Hammadde */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Hammadde / Kaynak
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label className="text-[10px] text-muted-foreground mb-1 block">Hammadde / Malzeme *</label>
                <input
                  value={form.hammadde}
                  onChange={(e) => setForm((f) => ({ ...f, hammadde: e.target.value }))}
                  placeholder="Hammadde cinsi veya tanımı..."
                  className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Hammadde Lot No</label>
                <input
                  value={form.hammadde_lot}
                  onChange={(e) => setForm((f) => ({ ...f, hammadde_lot: e.target.value }))}
                  placeholder="Lot / seri no..."
                  className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] text-muted-foreground mb-1 block">Tedarikçi</label>
                <input
                  value={form.hammadde_tedarikci}
                  onChange={(e) => setForm((f) => ({ ...f, hammadde_tedarikci: e.target.value }))}
                  placeholder="Tedarikçi firma adı..."
                  className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Alici */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Alıcı / Sevkiyat
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label className="text-[10px] text-muted-foreground mb-1 block">Alıcı / Giden Yer *</label>
                <input
                  value={form.alici}
                  onChange={(e) => setForm((f) => ({ ...f, alici: e.target.value }))}
                  placeholder="Müşteri, departman veya depo adı..."
                  className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Sipariş No</label>
                <input
                  value={form.alici_siparis_no}
                  onChange={(e) => setForm((f) => ({ ...f, alici_siparis_no: e.target.value }))}
                  placeholder="Sipariş / iş emri no..."
                  className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Sevkiyat Tarihi</label>
                <input
                  type="date"
                  value={form.sevkiyat_tarihi}
                  onChange={(e) => setForm((f) => ({ ...f, sevkiyat_tarihi: e.target.value }))}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Notlar */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Notlar</label>
            <textarea
              value={form.notlar}
              onChange={(e) => setForm((f) => ({ ...f, notlar: e.target.value }))}
              placeholder="Ek notlar..."
              rows={2}
              className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Etiket alanları özeti */}
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Basılan Etiket Bilgileri</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(record.fields as Record<string, string>).map(([k, v]) =>
                v ? (
                  <div key={k} className="flex gap-1 text-[10px]">
                    <span className="text-muted-foreground capitalize shrink-0">{k}:</span>
                    <span className="text-foreground font-medium truncate">{v}</span>
                  </div>
                ) : null
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Server response indicator */}
            <div className="text-xs font-medium transition-all">
              {saveStatus === "success" && (
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                  Supabase&apos;e kaydedildi
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center gap-1.5 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  Kaydetme başarısız
                </span>
              )}
            </div>
            <Button size="sm" onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save className="h-3.5 w-3.5" />
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const PAGE_SIZE = 8

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab() {
  const [records, setRecords] = useState<TraceabilityLabel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")
  const [page, setPage]       = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from(TABLES.TRACEABILITY_LABELS)
      .select("*")
      .order("printed_at", { ascending: false })
      .limit(500)
    setRecords((data as TraceabilityLabel[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1) }, [search])

  const handleDelete = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from(TABLES.TRACEABILITY_LABELS)
      .delete()
      .eq("id", id)
    if (!error) {
      setRecords((prev) => prev.filter((r) => r.id !== id))
      return true
    }
    return false
  }

  const handleSave = async (id: string, patch: Partial<TraceabilityLabel>): Promise<boolean> => {
    // Coerce empty strings to null for nullable DB columns, especially date fields
    const cleaned: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(patch)) {
      cleaned[k] = (typeof v === "string" && v.trim() === "") ? null : v
    }
    cleaned.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from(TABLES.TRACEABILITY_LABELS)
      .update(cleaned)
      .eq("id", id)

    if (!error) {
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      )
      return true
    } else {
      return false
    }
  }

  const filtered = records.filter((r) => {
    const q = search.toLowerCase()
    if (!q) return true
    const urun = ((r.fields as any)?.urun ?? "").toLowerCase()
    return (
      r.trace_no.toLowerCase().includes(q) ||
      urun.includes(q) ||
      (r.alici ?? "").toLowerCase().includes(q) ||
      (r.hammadde ?? "").toLowerCase().includes(q)
    )
  })

  // Group filtered records by date (YYYY-MM-DD), sorted newest first
  const grouped: { dateKey: string; label: string; items: TraceabilityLabel[] }[] = []
  for (const r of filtered) {
    const dateKey = r.printed_at.slice(0, 10) // "2026-05-03"
    const [y, m, d] = dateKey.split("-")
    const label = `${d}.${m}.${y}`
    const existing = grouped.find((g) => g.dateKey === dateKey)
    if (existing) existing.items.push(r)
    else grouped.push({ dateKey, label, items: [r] })
  }
  // Sort groups newest first
  grouped.sort((a, b) => b.dateKey.localeCompare(a.dateKey))

  // Pagination operates on date groups
  const totalPages  = Math.max(1, Math.ceil(grouped.length / PAGE_SIZE))
  const paginatedGroups = grouped.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const completeCount = records.filter((r) => r.hammadde && r.alici).length

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Stats bar */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-muted/10 shrink-0">
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">{records.length}</div>
          <div className="text-[10px] text-muted-foreground">Toplam</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-600">{completeCount}</div>
          <div className="text-[10px] text-muted-foreground">Tam dolu</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <div className="text-lg font-bold text-amber-600">{records.length - completeCount}</div>
          <div className="text-[10px] text-muted-foreground">Eksik</div>
        </div>
        <div className="flex-1" />
        <button
          onClick={load}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          title="Yenile"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-5 py-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün adı, trace no, alıcı ara..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Date-grouped list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-2 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Yükleniyor...</div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {search ? "Arama sonucu bulunamadı." : "Henüz basılmış etiket yok."}
          </div>
        ) : (
          paginatedGroups.map((group) => (
            <DateGroup
              key={group.dateKey}
              dateLabel={group.label}
              items={group.items}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Pagination — over date groups */}
      {!loading && grouped.length > PAGE_SIZE && (
        <div className="shrink-0 flex items-center justify-between px-5 py-2 border-t border-border bg-muted/10">
          <span className="text-[10px] text-muted-foreground">
            {grouped.length} gün — sayfa {page} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-2.5 py-1 rounded-lg text-xs border border-border bg-muted/30 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              &lsaquo; Önceki
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...")
                acc.push(p)
                return acc
              }, [])
              .map((item, idx) =>
                item === "..." ? (
                  <span key={`dots-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                      page === item
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted/30 hover:bg-muted text-foreground"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1 rounded-lg text-xs border border-border bg-muted/30 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Sonraki &rsaquo;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Date Group ───────────────────────────────────────────────────────────────
function DateGroup({
  dateLabel,
  items,
  onSave,
  onDelete,
}: {
  dateLabel: string
  items: TraceabilityLabel[]
  onSave: (id: string, patch: Partial<TraceabilityLabel>) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}) {
  const [open, setOpen] = useState(true)
  const completeInGroup = items.filter((r) => r.hammadde && r.alici).length

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Date header — click to collapse */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">{dateLabel}</span>
          <span className="text-[10px] text-muted-foreground">{items.length} etiket</span>
          {completeInGroup < items.length && (
            <span className="text-[10px] font-medium text-amber-500">
              {items.length - completeInGroup} eksik
            </span>
          )}
          {completeInGroup === items.length && (
            <span className="text-[10px] font-medium text-emerald-500">Tümü tam</span>
          )}
        </div>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {/* Records for this date */}
      {open && (
        <div className="divide-y divide-border/50">
          {items.map((r) => (
            <HistoryRow key={r.id} record={r} onSave={onSave} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function TraceabilityLabelModal({ onClose }: TraceabilityLabelModalProps) {
  const [activeTab, setActiveTab]  = useState<"label" | "history">("label")
  const [traceNo, setTraceNo]      = useState(generateTraceNumber())
  const [fields, setFields]        = useState<LabelField[]>(DEFAULT_FIELDS)
  const [copies, setCopies]        = useState(1)
  const [showFieldMenu, setShowFieldMenu] = useState(false)
  const [qrDataUrl, setQrDataUrl]  = useState("")
  const [saving, setSaving]        = useState(false)
  const qrPreviewRef = useRef<HTMLCanvasElement>(null)
  const qrPrintRef   = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const previewCanvas = qrPreviewRef.current
    if (previewCanvas) {
      QRCode.toCanvas(previewCanvas, traceNo, {
        width: 56, margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "M",
      })
    }
    const printCanvas = qrPrintRef.current
    if (printCanvas) {
      QRCode.toCanvas(printCanvas, traceNo, {
        width: 300, margin: 1,
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

  // Save to Supabase then open print window
  const handlePrint = async () => {
    // Build fields snapshot
    const fieldsSnapshot: Record<string, string> = {}
    fields.forEach((f) => { if (f.enabled) fieldsSnapshot[f.id] = f.value })

    setSaving(true)
    await supabase.from(TABLES.TRACEABILITY_LABELS).insert({
      trace_no:   traceNo,
      printed_at: new Date().toISOString(),
      copies,
      fields:     fieldsSnapshot,
    })
    setSaving(false)

    // Build print HTML
    const logoUrl = `${window.location.origin}/ruzgar-civata-logo.png`
    const S = 378

    const bigField   = enabledFields.find((f) => f.big && f.value.trim())
    const restFields = enabledFields.filter((f) => !f.big && f.value.trim())
    const dateField  = restFields.find((f) => f.id === "tarih")
    const mainFields = restFields.filter((f) => f.id !== "tarih")

    const gridCells = mainFields.map((f, i) => {
      const isLast = i === mainFields.length - 1
      const isOdd  = mainFields.length % 2 !== 0
      const span   = isLast && isOdd ? "grid-column:1/3;" : ""
      return `<div style="${span}padding:3px 6px 3px 0;">
        <div style="font-size:9px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:1px;">${f.label}</div>
        <div style="font-size:13px;font-weight:900;color:#000;line-height:1.1;word-break:break-word;">${f.value}</div>
      </div>`
    }).join("")

    const fieldCount = mainFields.length
    const productFontSize = bigField
      ? (fieldCount > 4 ? 18 : bigField.value.length > 20 ? 18 : bigField.value.length > 12 ? 22 : 26)
      : 18

    const labelHtml = `
<div style="width:${S}px;height:${S}px;padding:8px 12px;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;background:#ffffff;display:flex;flex-direction:column;overflow:hidden;">
  <div style="border:2px solid #000;padding:4px;display:flex;align-items:center;justify-content:center;height:88px;flex-shrink:0;margin-bottom:6px;overflow:hidden;">
    <img src="${logoUrl}" style="width:100%;height:80px;object-fit:contain;display:block;" />
  </div>
  <div style="border-bottom:2px solid #000;padding-bottom:4px;margin-bottom:4px;flex-shrink:0;">
    <div style="font-size:8px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:1px;margin-bottom:1px;">URUN / PRODUCT</div>
    <div style="font-size:${productFontSize}px;font-weight:900;color:#000;line-height:1.1;word-break:break-word;">${bigField ? bigField.value : "—"}</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;column-gap:8px;flex-shrink:0;margin-bottom:4px;">${gridCells}</div>
  <div style="flex:1;min-height:4px;"></div>
  <div style="display:flex;align-items:center;gap:10px;border-top:2px solid #000;padding-top:6px;flex-shrink:0;">
    <img src="${qrDataUrl}" style="width:68px;height:68px;flex-shrink:0;display:block;" />
    <div style="flex:1;overflow:hidden;">
      <div style="font-size:8px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">TRACEABILITY NO</div>
      <div style="font-size:10px;font-family:'Courier New',Courier,monospace;font-weight:700;color:#000;word-break:break-all;line-height:1.3;">${traceNo}</div>
      ${dateField ? `<div style="font-size:12px;font-weight:700;color:#000;margin-top:3px;">Tarih: ${dateField.value}</div>` : ""}
    </div>
  </div>
</div>`

    const labelsHtml = Array(copies).fill(labelHtml).join("")
    const win = window.open("", "_blank", "width=520,height=620")
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"/><title>Traceability — ${traceNo}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  @page{size:100mm 100mm;margin:0;}
  html,body{width:${S}px;margin:0;padding:0;background:#fff;}
  @media print{*{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}}
</style></head><body>
  ${labelsHtml}
  <script>
    var imgs=document.querySelectorAll('img'),total=imgs.length,loaded=0;
    function tryPrint(){loaded++;if(loaded>=total){setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},400);}}
    if(total===0){setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},400);}
    else{imgs.forEach(function(img){if(img.complete&&img.naturalWidth>0){tryPrint();}else{img.onload=tryPrint;img.onerror=tryPrint;}});}
  <\/script>
</body></html>`)
    win.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Traceability Etiket</h2>
            <p className="text-xs text-muted-foreground mt-0.5">100 × 100 mm — QR kodlu</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0 px-5">
          <button
            onClick={() => setActiveTab("label")}
            className={`flex items-center gap-2 text-xs font-semibold py-2.5 px-1 mr-5 border-b-2 transition-colors ${
              activeTab === "label"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            Etiket Oluştur
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 text-xs font-semibold py-2.5 px-1 border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Geçmiş
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col">

          {/* ── Label tab ── */}
          {activeTab === "label" && (
            <div className="flex flex-1 min-h-0">

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
                    >−</button>
                    <span className="w-10 text-center text-sm font-semibold">{copies}</span>
                    <button
                      onClick={() => setCopies((c) => Math.min(20, c + 1))}
                      className="w-8 h-8 rounded-lg border border-border bg-muted/40 hover:bg-muted flex items-center justify-center text-base font-bold transition-colors"
                    >+</button>
                    <span className="text-xs text-muted-foreground ml-1">adet</span>
                  </div>
                </div>
              </div>

              {/* RIGHT PREVIEW */}
              <div className="w-64 shrink-0 border-l border-border bg-muted/10 px-4 py-4 flex flex-col items-center gap-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Önizleme</p>

                <div className="flex justify-center">
                  <div
                    className="overflow-hidden text-black flex flex-col"
                    style={{ width: 220, height: 220, background: "#fff", border: "2px solid #000", padding: "4px 5px", flexShrink: 0 }}
                  >
                    <div style={{ border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", height: 55, marginBottom: 4, flexShrink: 0, padding: 2, overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/ruzgar-civata-logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                    <div style={{ borderBottom: "1px solid #000", paddingBottom: 2, marginBottom: 2, flexShrink: 0 }}>
                      <div style={{ fontSize: 4, fontWeight: 700, color: "#000", textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 1 }}>URUN / PRODUCT</div>
                      <div style={{ fontSize: 9, fontWeight: 900, color: "#000", lineHeight: 1.1, wordBreak: "break-word" as const }}>
                        {enabledFields.find((f) => f.big)?.value || "—"}
                      </div>
                    </div>
                    {(() => {
                      const infoFields = enabledFields.filter((f) => !f.big && f.id !== "tarih" && f.value.trim())
                      return (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 4, flexShrink: 0, marginBottom: 2 }}>
                          {infoFields.map((f, i) => (
                            <div key={f.id} style={{ gridColumn: (i === infoFields.length - 1 && infoFields.length % 2 !== 0) ? "1/3" : undefined, padding: "1px 2px 1px 0" }}>
                              <div style={{ fontSize: 3.5, fontWeight: 700, color: "#000", textTransform: "uppercase" as const, letterSpacing: "0.3px" }}>{f.label}</div>
                              <div style={{ fontSize: 5.5, fontWeight: 900, color: "#000", lineHeight: 1.1, wordBreak: "break-word" as const }}>{f.value}</div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                    <div style={{ flex: 1, minHeight: 2 }} />
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
                  Zebra GC420t termal optimize
                </p>
              </div>
            </div>
          )}

          {/* ── History tab ── */}
          {activeTab === "history" && <HistoryTab />}
        </div>

        {/* Hidden print canvas */}
        <canvas ref={qrPrintRef} style={{ display: "none" }} />

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-background shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>Kapat</Button>
          {activeTab === "label" && (
            <Button onClick={handlePrint} disabled={saving} className="flex items-center gap-2 bg-primary">
              <Printer className="h-4 w-4" />
              {saving ? "Kaydediliyor..." : copies > 1 ? `${copies} Etiket Yazdır` : "Yazdır / PDF"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
