"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import type { ShelfId, ShelfLayout, WarehouseLayout } from "@/lib/database"
import { generateUniqueShelfId } from "@/lib/database"
import ShelfModal from "@/components/shelf-modal"
import ShelfLayersEditor from "@/components/shelf-layers-editor"
import ConfirmDialog from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Save, Lock, Unlock, Grid, Plus, Trash2, Edit3, Check, X, Layers, RotateCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"

interface DraggableWarehouseMapProps {
  onShelfClick: (shelfId: ShelfId) => void
}

interface DraggableShelfProps {
  shelf: ShelfLayout
  isEditMode: boolean
  onUpdate: (shelf: ShelfLayout) => void
  onDelete: (shelfId: ShelfId) => void
  onClick: (shelfId: ShelfId) => void
  onStartNameEdit: (shelfId: ShelfId) => void
  onEditLayers: (shelf: ShelfLayout) => void
  onRotate: (shelfId: ShelfId) => void
  isEditingName: boolean
  editingName: string
  onNameChange: (name: string) => void
  onSaveName: () => void
  onCancelNameEdit: () => void
}

function DraggableShelf({
  shelf,
  isEditMode,
  onUpdate,
  onDelete,
  onClick,
  onStartNameEdit,
  onEditLayers,
  onRotate,
  isEditingName,
  editingName,
  onNameChange,
  onSaveName,
  onCancelNameEdit,
}: DraggableShelfProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 })
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 })
  const shelfRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingName])

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
    if (!isEditMode || isEditingName) {
      if (!isEditingName && onClick) {
        onClick(shelf.id)
      }
      return
    }

    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialPosition({ x: shelf.x, y: shelf.y })
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode || isEditingName) return

    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialSize({ width: shelf.width, height: shelf.height })
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDelete) {
      onDelete(shelf.id)
    }
  }

  const handleEditNameClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onStartNameEdit) {
      onStartNameEdit(shelf.id)
    }
  }

  const handleEditLayersClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onEditLayers) {
      onEditLayers(shelf)
    }
  }

  const handleRotateClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onRotate) {
      onRotate(shelf.id)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (onSaveName) {
        onSaveName()
      }
    } else if (e.key === "Escape") {
      if (onCancelNameEdit) {
        onCancelNameEdit()
      }
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isEditMode || isEditingName) return

      if (isDragging && shelfRef.current && onUpdate) {
        const container = shelfRef.current.parentElement
        if (!container) return

        const containerRect = container.getBoundingClientRect()
        const deltaX = ((e.clientX - dragStart.x) / containerRect.width) * 100
        const deltaY = ((e.clientY - dragStart.y) / containerRect.height) * 100

        const newX = Math.max(0, Math.min(95, initialPosition.x + deltaX))
        const newY = Math.max(0, Math.min(95, initialPosition.y + deltaY))

        onUpdate({ ...shelf, x: newX, y: newY })
      }

      if (isResizing && shelfRef.current && onUpdate) {
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
  }, [isDragging, isResizing, dragStart, initialPosition, initialSize, shelf, onUpdate, isEditMode, isEditingName])

  // Get rotation transform
  const getRotationTransform = () => {
    const rotation = shelf.rotation || 0
    return `rotate(${rotation}deg)`
  }

  return (
    <div
      ref={shelfRef}
      className={`absolute rounded-md ${getShelfColor()} flex items-center justify-center font-bold text-sm sm:text-base md:text-lg lg:text-xl transition-all duration-200 ${
        isEditMode && !isEditingName
          ? "cursor-move border-2 border-dashed border-white/50 shadow-lg"
          : "cursor-pointer hover:shadow-lg"
      } ${isDragging ? "z-50 scale-105" : ""} ${isResizing ? "z-50" : ""} ${isEditingName ? "z-50" : ""}`}
      style={{
        left: `${shelf.x}%`,
        top: `${shelf.y}%`,
        width: `${shelf.width}%`,
        height: `${shelf.height}%`,
        transform: getRotationTransform(),
        transformOrigin: "center center",
      }}
      onMouseDown={handleMouseDown}
    >
      {isEditingName ? (
        <div className="flex items-center gap-1 px-2" onClick={(e) => e.stopPropagation()}>
          <Input
            ref={inputRef}
            value={editingName}
            onChange={(e) => onNameChange && onNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-6 text-xs bg-white text-black border-none p-1 min-w-0 flex-1"
            style={{ fontSize: "10px" }}
          />
          <button
            className="w-5 h-5 bg-green-500 hover:bg-green-600 text-white rounded flex items-center justify-center transition-colors duration-200"
            onClick={onSaveName}
            title="Kaydet"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center transition-colors duration-200"
            onClick={onCancelNameEdit}
            title="İptal"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <span className="select-none px-1 text-center break-words">{shelf.id}</span>
      )}

      {isEditMode && !isEditingName && (
        <>
          {/* Edit name button */}
          <button
            className="absolute top-1 left-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 opacity-80 hover:opacity-100"
            onMouseDown={handleEditNameClick}
            title="İsmi Düzenle"
          >
            <Edit3 className="h-3 w-3" />
          </button>

          {/* Edit layers button */}
          <button
            className="absolute top-1 left-8 w-6 h-6 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 opacity-80 hover:opacity-100"
            onMouseDown={handleEditLayersClick}
            title="Katmanları Düzenle"
          >
            <Layers className="h-3 w-3" />
          </button>

          {/* Rotate button */}
          <button
            className="absolute top-1 left-15 w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 opacity-80 hover:opacity-100"
            onMouseDown={handleRotateClick}
            title="Döndür (90°)"
            style={{ left: "60px" }}
          >
            <RotateCw className="h-3 w-3" />
          </button>

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

// Utility function to validate and normalize layout data
function validateAndNormalizeLayout(data: any): WarehouseLayout {
  console.log("🔍 Validating layout data:", data)

  // If no data, return default layout
  if (!data) {
    console.log("❌ No layout data, using default")
    return getDefaultLayout()
  }

  // Ensure we have a valid layout structure
  const layout = data.layout || data

  // Validate and normalize shelves array
  let shelves: ShelfLayout[] = []

  if (Array.isArray(layout.shelves)) {
    // If shelves is already an array, normalize each shelf
    shelves = layout.shelves.map((shelf: any, index: number) => ({
      id: shelf.id || `Shelf${index + 1}`,
      x: typeof shelf.x === "number" ? shelf.x : 10 + index * 25,
      y: typeof shelf.y === "number" ? shelf.y : 10,
      width: typeof shelf.width === "number" ? shelf.width : 20,
      height: typeof shelf.height === "number" ? shelf.height : 15,
      rotation: typeof shelf.rotation === "number" ? shelf.rotation : 0,
      isCommon: Boolean(shelf.isCommon),
      customLayers: Array.isArray(shelf.customLayers) ? shelf.customLayers : undefined,
    }))
  } else if (layout.shelves && typeof layout.shelves === "object") {
    // If shelves is an object, convert to array
    console.log("⚠️ Converting shelves object to array")
    const shelvesObj = layout.shelves
    shelves = Object.keys(shelvesObj).map((key, index) => {
      const shelf = shelvesObj[key]
      return {
        id: shelf.id || key,
        x: typeof shelf.x === "number" ? shelf.x : 10 + index * 25,
        y: typeof shelf.y === "number" ? shelf.y : 10,
        width: typeof shelf.width === "number" ? shelf.width : 20,
        height: typeof shelf.height === "number" ? shelf.height : 15,
        rotation: typeof shelf.rotation === "number" ? shelf.rotation : 0,
        isCommon: Boolean(shelf.isCommon),
        customLayers: Array.isArray(shelf.customLayers) ? shelf.customLayers : undefined,
      }
    })
  } else {
    // If shelves is invalid or missing, use default shelves
    console.log("❌ Invalid or missing shelves, using default")
    shelves = getDefaultLayout().shelves
  }

  const normalizedLayout: WarehouseLayout = {
    id: layout.id || "default",
    name: layout.name || "Varsayılan Layout",
    shelves: shelves,
    createdAt: layout.createdAt || Date.now(),
    updatedAt: layout.updatedAt || Date.now(),
  }

  console.log("✅ Layout normalized:", normalizedLayout)
  return normalizedLayout
}

// Default layout function
function getDefaultLayout(): WarehouseLayout {
  return {
    id: "default",
    name: "Varsayılan Layout",
    shelves: [
      { id: "A", x: 10, y: 10, width: 20, height: 15, rotation: 0, isCommon: false },
      { id: "B", x: 40, y: 10, width: 20, height: 15, rotation: 0, isCommon: false },
      { id: "C", x: 70, y: 10, width: 20, height: 15, rotation: 0, isCommon: false },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export default function DraggableWarehouseMap() {
  const [layout, setLayout] = useState<WarehouseLayout | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedShelf, setSelectedShelf] = useState<ShelfId | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingShelfId, setEditingShelfId] = useState<ShelfId | null>(null)
  const [editingName, setEditingName] = useState("")
  const [layersEditorShelf, setLayersEditorShelf] = useState<ShelfLayout | null>(null)
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
  const { username } = useAuth()
  const [debouncedSaveTimeout, setDebouncedSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchLayout()
  }, [])

  const fetchLayout = async () => {
    try {
      setLoading(true)
      console.log("🔄 Fetching layout from API...")

      const response = await fetch("/api/layout", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      console.log("📡 Response status:", response.status)
      console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        console.error("❌ HTTP error! status:", response.status)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      console.log("📡 Content-Type:", contentType)

      let data
      try {
        const responseText = await response.text()
        console.log("📡 Raw response text:", responseText.substring(0, 200) + "...")

        if (!responseText.trim()) {
          throw new Error("Empty response")
        }

        data = JSON.parse(responseText)
        console.log("📦 Parsed JSON response:", data)
      } catch (parseError) {
        console.error("❌ JSON parsing failed:", parseError)
        console.error("❌ Response was not valid JSON, using default layout")

        // Set default layout and show warning
        const defaultLayout = getDefaultLayout()
        setLayout(defaultLayout)

        toast({
          title: "Uyarı",
          description: "Sunucudan geçersiz yanıt alındı. Varsayılan layout kullanılıyor.",
          variant: "destructive",
        })
        return
      }

      // Validate and normalize the layout data
      const validatedLayout = validateAndNormalizeLayout(data)
      console.log("✅ Setting validated layout:", validatedLayout)

      setLayout(validatedLayout)
    } catch (error) {
      console.error("❌ Error fetching layout:", error)

      // Set default layout on error
      const defaultLayout = getDefaultLayout()
      setLayout(defaultLayout)

      toast({
        title: "Uyarı",
        description: "Layout yüklenirken bir hata oluştu. Varsayılan layout kullanılıyor.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveLayout = async (layoutToSave: WarehouseLayout, skipLogging = false) => {
    try {
      console.log("💾 Saving layout to API...")

      const response = await fetch("/api/layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          layout: layoutToSave,
          username: username || "Bilinmeyen Kullanıcı",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save layout")
      }

      console.log("Layout saved successfully")

      // Log the layout change
      if (!skipLogging && username) {
        // Log layout change here if needed
      }
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

  const handleShelfUpdate = (updatedShelf: ShelfLayout) => {
    console.log("🔄 Shelf updated:", updatedShelf.id)

    setLayout((prevLayout) => {
      if (!prevLayout) return prevLayout

      const updatedLayout = {
        ...prevLayout,
        shelves: prevLayout.shelves.map((shelf) => (shelf.id === updatedShelf.id ? updatedShelf : shelf)),
        updatedAt: Date.now(),
      }

      // Clear existing timeout
      if (debouncedSaveTimeout) {
        clearTimeout(debouncedSaveTimeout)
      }

      // Set new timeout for debounced save
      const newTimeout = setTimeout(() => {
        console.log("⏰ Debounced save triggered for shelf:", updatedShelf.id)
        saveLayout(updatedLayout, true) // Skip logging for position updates
      }, 1000)

      setDebouncedSaveTimeout(newTimeout)

      return updatedLayout
    })
  }

  const handleShelfRotate = (shelfId: ShelfId) => {
    console.log("🔄 Rotating shelf:", shelfId)

    setLayout((prevLayout) => {
      if (!prevLayout) return prevLayout

      const updatedLayout = {
        ...prevLayout,
        shelves: prevLayout.shelves.map((shelf) =>
          shelf.id === shelfId ? { ...shelf, rotation: (shelf.rotation + 90) % 360 } : shelf,
        ),
        updatedAt: Date.now(),
      }

      // Save immediately for rotations (these are intentional actions)
      saveLayout(updatedLayout)

      return updatedLayout
    })
  }

  const handleShelfNameChange = (shelfId: ShelfId, newName: string) => {
    console.log("📝 Changing shelf name:", shelfId, "->", newName)

    setLayout((prevLayout) => {
      if (!prevLayout) return prevLayout

      const updatedLayout = {
        ...prevLayout,
        shelves: prevLayout.shelves.map((shelf) => (shelf.id === shelfId ? { ...shelf, name: newName } : shelf)),
        updatedAt: Date.now(),
      }

      // Save immediately for name changes
      saveLayout(updatedLayout)

      return updatedLayout
    })
  }

  const handleShelfDelete = async (shelfId: ShelfId) => {
    try {
      console.log("🗑️ Deleting shelf:", shelfId)

      // Check if shelf has products
      const checkResponse = await fetch("/api/layout", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "checkProducts",
          shelfId,
        }),
      })

      if (!checkResponse.ok) {
        throw new Error("Failed to check products")
      }

      const data = await checkResponse.json()
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

  const handleAddShelf = () => {
    const newShelfId = generateUniqueShelfId(layout?.shelves || [])
    if (!newShelfId) {
      toast({
        title: "Hata",
        description: "Maksimum raf sayısına ulaşıldı (A-Z).",
        variant: "destructive",
      })
      return
    }

    console.log("➕ Adding new shelf:", newShelfId)

    const newShelf: ShelfLayout = {
      id: newShelfId,
      x: 10,
      y: 10,
      width: 80,
      height: 60,
      rotation: 0,
      isCommon: false,
      name: `${newShelfId} Rafı`,
    }

    setLayout((prevLayout) => {
      if (!prevLayout) return prevLayout

      const updatedLayout = {
        ...prevLayout,
        shelves: [...prevLayout.shelves, newShelf],
        updatedAt: Date.now(),
      }

      // Save immediately for new shelves
      saveLayout(updatedLayout)

      return updatedLayout
    })

    toast({
      title: "Başarılı",
      description: `${newShelfId} rafı eklendi.`,
    })
  }

  const handleSaveLayout = () => {
    if (layout) {
      console.log("💾 Manual save triggered")
      saveLayout(layout)
    }
  }

  const handleResetLayout = async () => {
    try {
      console.log("🔄 Resetting layout...")

      const response = await fetch("/api/layout", {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to reset layout")
      }

      console.log("Layout reset successfully")
      fetchLayout()
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
    if (!isEditMode && !editingShelfId) {
      setSelectedShelf(shelfId)
    }
  }

  const handleCloseModal = () => {
    setSelectedShelf(null)
  }

  const handleStartNameEdit = (shelfId: ShelfId) => {
    setEditingShelfId(shelfId)
    setEditingName(layout?.shelves.find((shelf) => shelf.id === shelfId)?.name || "")
  }

  const handleEditLayers = (shelf: ShelfLayout) => {
    setLayersEditorShelf(shelf)
  }

  const handleNameChange = (name: string) => {
    setEditingName(name)
  }

  const handleSaveName = () => {
    if (editingShelfId && layout) {
      const updatedShelf = { ...layout.shelves.find((shelf) => shelf.id === editingShelfId)!, name: editingName }
      handleShelfUpdate(updatedShelf)
      setEditingShelfId(null)
      setEditingName("")
    }
  }

  const handleCancelNameEdit = () => {
    setEditingShelfId(null)
    setEditingName("")
  }

  const handleSaveLayers = (shelf: ShelfLayout) => {
    if (layout) {
      const updatedShelf = { ...shelf }
      handleShelfUpdate(updatedShelf)
      setLayersEditorShelf(null)
    }
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

  if (!layout || !Array.isArray(layout.shelves)) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-destructive mb-4">Layout yüklenemedi veya geçersiz format</p>
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
            {isEditMode
              ? "Rafları sürükleyin, boyutlandırın, döndürün, isimlerini ve katmanlarını düzenleyin"
              : "Raf detaylarını görmek için tıklayın"}
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
            disabled={!!editingShelfId}
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
                disabled={!!editingShelfId}
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <Plus className="h-4 w-4" />
                Raf Ekle
              </Button>

              <Button
                size="sm"
                onClick={handleSaveLayout}
                disabled={saving || !!editingShelfId}
                className="flex items-center gap-2 bg-primary"
              >
                <Save className="h-4 w-4" />
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Küçük düzenleme modu bildirimi - Ana alanın dışında */}
      {isEditMode && (
        <div className="mb-3 flex justify-center">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">Düzenleme Aktif</span>
            <span className="opacity-75">•</span>
            <span className="opacity-90">Mavi: İsim | Mor: Katman | Turuncu: Döndür | Kırmızı: Sil</span>
          </div>
        </div>
      )}

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
            onUpdate={(updatedShelf) => handleShelfUpdate(updatedShelf)}
            onDelete={handleShelfDelete}
            onClick={handleShelfClick}
            onStartNameEdit={handleStartNameEdit}
            onEditLayers={handleEditLayers}
            onRotate={handleShelfRotate}
            isEditingName={editingShelfId === shelf.id}
            editingName={editingName}
            onNameChange={handleNameChange}
            onSaveName={handleSaveName}
            onCancelNameEdit={handleCancelNameEdit}
          />
        ))}

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
        open={deleteConfirm ? deleteConfirm.open : false}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="Rafı Sil"
        description={
          deleteConfirm && deleteConfirm.productCount > 0
            ? `Bu rafta ${deleteConfirm.productCount} ürün bulunuyor. Rafı silerseniz bu ürünler erişilemez hale gelecek. Devam etmek istediğinizden emin misiniz?`
            : deleteConfirm && `${deleteConfirm.shelfId} rafını silmek istediğinizden emin misiniz?`
        }
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={confirmDeleteShelf}
      />

      {/* Layers editor dialog */}
      {layersEditorShelf && (
        <ShelfLayersEditor
          open={!!layersEditorShelf}
          onOpenChange={(open) => !open && setLayersEditorShelf(null)}
          shelf={layersEditorShelf}
          onSave={handleSaveLayers}
        />
      )}

      {selectedShelf && (
        <ShelfModal
          shelfId={selectedShelf}
          onClose={handleCloseModal}
          onRefresh={() => {
            // Force re-fetch of layout when modal refreshes
            fetchLayout()
          }}
        />
      )}
    </div>
  )
}

// Debounce function
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout | null = null
  return function (...args: any[]) {
    clearTimeout(timeout!)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

function getNextAvailableShelfId(shelves: ShelfLayout[] = []): ShelfId | null {
  const existingIds = shelves.map((shelf) => shelf.id.toUpperCase())
  for (let i = 65; i <= 90; i++) {
    const id = String.fromCharCode(i)
    if (!existingIds.includes(id)) {
      return id as ShelfId
    }
  }
  return null
}

function confirmDeleteShelf() {
  // Implementation for confirming shelf deletion
}
