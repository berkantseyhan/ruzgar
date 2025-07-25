"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { ShelfId, ShelfLayout, WarehouseLayout } from "@/lib/redis"
import { generateUniqueShelfId } from "@/lib/redis"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Save, RotateCcw, Lock, Unlock, Grid, Settings, Plus, Trash2 } from "lucide-react"
import ShelfModal from "@/components/shelf-modal"
import ConfirmDialog from "@/components/confirm-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DraggableShelfProps {
  shelf: ShelfLayout
  isEditMode: boolean
  onUpdate: (shelf: ShelfLayout) => void
  onDelete: (shelfId: ShelfId) => void
  onClick: (shelfId: ShelfId) => void
}

function DraggableShelf({ shelf, isEditMode, onUpdate, onDelete, onClick }: DraggableShelfProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 })
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 })
  const shelfRef = useRef<HTMLDivElement>(null)

  const getShelfColor = () => {
    if (shelf.isCommon) return "bg-shelf-common text-white"

    switch (shelf.id) {
      case "A":
        return "bg-shelf-a text-white"
      case "B":
        return "bg-shelf-b text-white"
      case "C":
        return "bg-shelf-c text-white"
      case "D":
        return "bg-shelf-d text-white"
      case "E":
        return "bg-shelf-e text-white"
      case "F":
        return "bg-shelf-f text-white"
      case "G":
        return "bg-shelf-g text-white"
      default:
        return "bg-shelf-common text-white"
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode) {
      onClick(shelf.id)
      return
    }

    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialPosition({ x: shelf.x, y: shelf.y })
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode) return

    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialSize({ width: shelf.width, height: shelf.height })
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete(shelf.id)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isEditMode) return

      if (isDragging && shelfRef.current) {
        const container = shelfRef.current.parentElement
        if (!container) return

        const containerRect = container.getBoundingClientRect()
        const deltaX = ((e.clientX - dragStart.x) / containerRect.width) * 100
        const deltaY = ((e.clientY - dragStart.y) / containerRect.height) * 100

        const newX = Math.max(0, Math.min(95, initialPosition.x + deltaX))
        const newY = Math.max(0, Math.min(95, initialPosition.y + deltaY))

        onUpdate({ ...shelf, x: newX, y: newY })
      }

      if (isResizing && shelfRef.current) {
        const container = shelfRef.current.parentElement
        if (!container) return

        const containerRect = container.getBoundingClientRect()
        const deltaX = ((e.clientX - dragStart.x) / containerRect.width) * 100
        const deltaY = ((e.clientY - dragStart.y) / containerRect.height) * 100

        const newWidth = Math.max(5, Math.min(50, initialSize.width + deltaX))
        const newHeight = Math.max(5, Math.min(50, initialSize.height + deltaY))

        onUpdate({ ...shelf, width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isResizing, dragStart, initialPosition, initialSize, shelf, onUpdate, isEditMode])

  return (
    <div
      ref={shelfRef}
      className={`absolute rounded-md ${getShelfColor()} flex items-center justify-center font-bold text-sm sm:text-base md:text-lg lg:text-xl transition-all duration-200 ${
        isEditMode ? "cursor-move border-2 border-dashed border-white/50 shadow-lg" : "cursor-pointer hover:shadow-lg"
      } ${isDragging ? "z-50 scale-105" : ""} ${isResizing ? "z-50" : ""}`}
      style={{
        left: `${shelf.x}%`,
        top: `${shelf.y}%`,
        width: `${shelf.width}%`,
        height: `${shelf.height}%`,
      }}
      onMouseDown={handleMouseDown}
    >
      <span className="select-none">{shelf.id}</span>

      {isEditMode && (
        <>
          {/* Delete button */}
          <button
            className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 opacity-80 hover:opacity-100"
            onMouseDown={handleDeleteClick}
            title="Rafı Sil"
          >
            <Trash2 className="h-3 w-3" />
          </button>

          {/* Resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-white/80 cursor-se-resize rounded-tl-md flex items-center justify-center"
            onMouseDown={handleResizeMouseDown}
          >
            <div className="w-2 h-2 border-r-2 border-b-2 border-gray-600"></div>
          </div>
        </>
      )}
    </div>
  )
}

export default function DraggableWarehouseMap() {
  const [layout, setLayout] = useState<WarehouseLayout | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedShelf, setSelectedShelf] = useState<ShelfId | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    shelfId: ShelfId | null
    productCount: number
  }>({
    open: false,
    shelfId: null,
    productCount: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchLayout()
  }, [])

  const fetchLayout = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/layout")
      if (!response.ok) {
        throw new Error("Failed to fetch layout")
      }
      const data = await response.json()
      setLayout(data.layout)
    } catch (error) {
      console.error("Error fetching layout:", error)
      toast({
        title: "Hata",
        description: "Layout yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleShelfUpdate = (updatedShelf: ShelfLayout) => {
    if (!layout) return

    const updatedShelves = layout.shelves.map((shelf) => (shelf.id === updatedShelf.id ? updatedShelf : shelf))

    setLayout({
      ...layout,
      shelves: updatedShelves,
    })
  }

  const handleAddShelf = () => {
    if (!layout) return

    const newShelfId = generateUniqueShelfId(layout.shelves)
    const newShelf: ShelfLayout = {
      id: newShelfId,
      x: 10,
      y: 10,
      width: 15,
      height: 15,
      isCommon: false,
    }

    setLayout({
      ...layout,
      shelves: [...layout.shelves, newShelf],
    })

    toast({
      title: "Yeni Raf Eklendi",
      description: `${newShelfId} rafı eklendi. Konumunu ve boyutunu ayarlayabilirsiniz.`,
    })
  }

  const handleDeleteShelf = async (shelfId: ShelfId) => {
    try {
      // Check if shelf has products
      const response = await fetch("/api/layout", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "checkProducts", shelfId }),
      })

      if (!response.ok) {
        throw new Error("Failed to check products")
      }

      const data = await response.json()
      setDeleteConfirm({
        open: true,
        shelfId,
        productCount: data.productCount,
      })
    } catch (error) {
      console.error("Error checking products:", error)
      toast({
        title: "Hata",
        description: "Raf kontrol edilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const confirmDeleteShelf = () => {
    if (!layout || !deleteConfirm.shelfId) return

    const updatedShelves = layout.shelves.filter((shelf) => shelf.id !== deleteConfirm.shelfId)

    setLayout({
      ...layout,
      shelves: updatedShelves,
    })

    toast({
      title: "Raf Silindi",
      description: `${deleteConfirm.shelfId} rafı silindi.`,
    })

    if (deleteConfirm.productCount > 0) {
      toast({
        title: "Uyarı",
        description: `Bu rafta ${deleteConfirm.productCount} ürün vardı. Bu ürünler artık erişilemez durumda.`,
        variant: "destructive",
      })
    }

    setDeleteConfirm({ open: false, shelfId: null, productCount: 0 })
  }

  const handleSaveLayout = async () => {
    if (!layout) return

    try {
      setSaving(true)
      const response = await fetch("/api/layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ layout }),
      })

      if (!response.ok) {
        throw new Error("Failed to save layout")
      }

      toast({
        title: "Başarılı",
        description: "Depo yerleşimi kaydedildi.",
      })
    } catch (error) {
      console.error("Error saving layout:", error)
      toast({
        title: "Hata",
        description: "Layout kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResetLayout = async () => {
    try {
      const response = await fetch("/api/layout", {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to reset layout")
      }

      await fetchLayout()
      toast({
        title: "Başarılı",
        description: "Depo yerleşimi varsayılan haline getirildi.",
      })
    } catch (error) {
      console.error("Error resetting layout:", error)
      toast({
        title: "Hata",
        description: "Layout sıfırlanırken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleShelfClick = (shelfId: ShelfId) => {
    if (!isEditMode) {
      setSelectedShelf(shelfId)
    }
  }

  const handleCloseModal = () => {
    setSelectedShelf(null)
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Layout yükleniyor...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!layout) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-destructive mb-4">Layout yüklenemedi</p>
            <Button onClick={fetchLayout}>Tekrar Dene</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="bg-primary/10 p-1 rounded-md">
              <Grid className="h-6 w-6 text-primary" />
            </span>
            Depo Yerleşim Planı
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isEditMode ? "Rafları sürükleyerek konumlarını değiştirin" : "Raf detaylarını görmek için tıklayın"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isEditMode ? "default" : "outline"} className="mr-2">
            {isEditMode ? "Düzenleme Modu" : "Görüntüleme Modu"}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="flex items-center gap-2"
          >
            {isEditMode ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            {isEditMode ? "Kilitle" : "Düzenle"}
          </Button>

          {isEditMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddShelf}
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <Plus className="h-4 w-4" />
                Raf Ekle
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleResetLayout}
                className="flex items-center gap-2 bg-transparent"
              >
                <RotateCcw className="h-4 w-4" />
                Sıfırla
              </Button>

              <Button
                size="sm"
                onClick={handleSaveLayout}
                disabled={saving}
                className="flex items-center gap-2 bg-primary"
              >
                <Save className="h-4 w-4" />
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="relative w-full max-w-5xl mx-auto aspect-[5/3] bg-muted/20 rounded-lg p-6 overflow-hidden border border-border shadow-md">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
              linear-gradient(to right, #94a3b8 1px, transparent 1px),
              linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
            `,
              backgroundSize: "20px 20px",
            }}
          ></div>
        </div>

        {/* Shelves */}
        {layout.shelves.map((shelf) => (
          <DraggableShelf
            key={shelf.id}
            shelf={shelf}
            isEditMode={isEditMode}
            onUpdate={handleShelfUpdate}
            onDelete={handleDeleteShelf}
            onClick={handleShelfClick}
          />
        ))}

        {/* Edit mode overlay */}
        {isEditMode && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-md text-sm">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Düzenleme Modu Aktif</span>
            </div>
            <p className="text-xs mt-1 opacity-80">Sürükle: Taşı | Sağ alt: Boyutlandır | Kırmızı X: Sil</p>
          </div>
        )}

        {/* Add shelf hint when no shelves */}
        {isEditMode && layout.shelves.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Grid className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Henüz raf yok</p>
              <p className="text-sm">Yeni raf eklemek için "Raf Ekle" butonunu kullanın</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="Rafı Sil"
        description={
          deleteConfirm.productCount > 0
            ? `Bu rafta ${deleteConfirm.productCount} ürün bulunuyor. Rafı silerseniz bu ürünler erişilemez hale gelecek. Devam etmek istediğinizden emin misiniz?`
            : `${deleteConfirm.shelfId} rafını silmek istediğinizden emin misiniz?`
        }
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={confirmDeleteShelf}
      />

      {selectedShelf && <ShelfModal shelfId={selectedShelf} onClose={handleCloseModal} />}
    </div>
  )
}
