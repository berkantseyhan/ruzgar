"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import type { ShelfId, ShelfLayout, WarehouseLayout } from "@/lib/database"
import { getAvailableLayersForShelf } from "@/lib/database"
import ShelfModal from "@/components/shelf-modal"
import ShelfLayersEditor from "@/components/shelf-layers-editor"
import ConfirmDialog from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Save, Lock, Unlock, Grid, Plus, Trash2, Edit3, Check, X, Layers, RotateCw, FileDown, CheckSquare, Square, ZoomIn, ZoomOut, Maximize2, Magnet, SlidersHorizontal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useWarehouse } from "@/lib/warehouse-context"

interface DraggableWarehouseMapProps {
  onShelfClick: (shelfId: ShelfId) => void
}

interface DraggableShelfProps {
  shelf: ShelfLayout
  isEditMode: boolean
  isSelectMode: boolean
  isSelected: boolean
  snapValue: (v: number) => number
  zoom: number
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
  isSelectMode,
  isSelected,
  snapValue,
  zoom,
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

    if (isSelectMode) return

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
        // Divide by zoom so that drag speed matches cursor under zoom
        const deltaX = ((e.clientX - dragStart.x) / (containerRect.width * zoom)) * 100
        const deltaY = ((e.clientY - dragStart.y) / (containerRect.height * zoom)) * 100

        const rawX = Math.max(0, Math.min(95, initialPosition.x + deltaX))
        const rawY = Math.max(0, Math.min(95, initialPosition.y + deltaY))

        onUpdate({ ...shelf, x: rawX, y: rawY })
      }

      if (isResizing && shelfRef.current && onUpdate) {
        const container = shelfRef.current.parentElement
        if (!container) return

        const containerRect = container.getBoundingClientRect()
        const deltaX = ((e.clientX - dragStart.x) / (containerRect.width * zoom)) * 100
        const deltaY = ((e.clientY - dragStart.y) / (containerRect.height * zoom)) * 100

        const newWidth = Math.max(5, Math.min(50, initialSize.width + deltaX))
        const newHeight = Math.max(5, Math.min(50, initialSize.height + deltaY))

        onUpdate({ ...shelf, width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      // Apply snap on release
      if (isDragging || isResizing) {
        onUpdate({
          ...shelf,
          x: snapValue(shelf.x),
          y: snapValue(shelf.y),
          width: snapValue(shelf.width),
          height: snapValue(shelf.height),
        })
      }
    }

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isResizing, dragStart, initialPosition, initialSize, shelf, onUpdate, isEditMode, isEditingName, zoom, snapValue])

  // Get rotation transform
  const getRotationTransform = () => {
    const rotation = shelf.rotation || 0
    return `rotate(${rotation}deg)`
  }

  return (
    <div
      ref={shelfRef}
      className={`absolute rounded-md ${getShelfColor()} flex items-center justify-center font-bold text-sm sm:text-base md:text-lg lg:text-xl transition-all duration-200 ${
        isEditMode && !isEditingName && !isSelectMode
          ? "cursor-move border-2 border-dashed border-white/50 shadow-lg"
          : isSelectMode
            ? "cursor-pointer"
            : "cursor-pointer hover:shadow-lg"
      } ${isDragging ? "z-50 scale-105" : ""} ${isResizing ? "z-50" : ""} ${isEditingName ? "z-50" : ""} ${
        isSelectMode && isSelected ? "ring-4 ring-white ring-offset-2 ring-offset-transparent scale-[1.03] brightness-110" : ""
      }`}
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
      {/* Selection checkbox overlay */}
      {isSelectMode && (
        <div className="absolute top-1 right-1 z-10 pointer-events-none">
          {isSelected ? (
            <div className="w-5 h-5 bg-white rounded flex items-center justify-center shadow">
              <Check className="h-3 w-3 text-green-600" strokeWidth={3} />
            </div>
          ) : (
            <div className="w-5 h-5 border-2 border-white/80 rounded bg-black/20"></div>
          )}
        </div>
      )}
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
        <span className="select-none px-1 text-center break-words">
          {shelf.name && shelf.name.trim() !== "" ? shelf.name : shelf.id.length > 10 ? "Raf" : shelf.id}
        </span>
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
      name: shelf.name || shelf.id, // Added shelf.name fallback
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
        name: shelf.name || shelf.id, // Added shelf.name fallback
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
      { id: "A", x: 10, y: 10, width: 20, height: 15, rotation: 0, isCommon: false, name: "A Rafı" },
      { id: "B", x: 40, y: 10, width: 20, height: 15, rotation: 0, isCommon: false, name: "B Rafı" },
      { id: "C", x: 70, y: 10, width: 20, height: 15, rotation: 0, isCommon: false, name: "C Rafı" },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export default function DraggableWarehouseMap() {
  const [layout, setLayout] = useState<WarehouseLayout | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedShelves, setSelectedShelves] = useState<Set<ShelfId>>(new Set())
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [selectedShelf, setSelectedShelf] = useState<ShelfId | null>(null)
  // Zoom & pan
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // Snap-to-grid
  const [snapEnabled, setSnapEnabled] = useState(true)
  const SNAP_GRID = 2 // percent
  // Properties panel
  const [propShelfId, setPropShelfId] = useState<ShelfId | null>(null)
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
  const { currentWarehouse, isMigrationNeeded } = useWarehouse()
  const [debouncedSaveTimeout, setDebouncedSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (currentWarehouse && !isMigrationNeeded) {
      fetchLayout()
    } else if (isMigrationNeeded) {
      setLoading(false)
      setLayout(null)
    }
  }, [currentWarehouse, isMigrationNeeded])

  const fetchLayout = async () => {
    if (!currentWarehouse) {
      console.log("❌ No current warehouse selected")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log("🔄 Fetching layout from API for warehouse:", currentWarehouse.id)

      const response = await fetch(`/api/layout?warehouse_id=${currentWarehouse.id}`, {
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

        const defaultLayout = getDefaultLayout()
        setLayout(defaultLayout)

        toast({
          title: "Uyarı",
          description: "Sunucudan geçersiz yanıt alındı. Varsayılan layout kullanılıyor.",
          variant: "destructive",
        })
        return
      }

      const validatedLayout = validateAndNormalizeLayout(data)
      console.log("✅ Setting validated layout:", validatedLayout)

      setLayout(validatedLayout)
    } catch (error) {
      console.error("❌ Error fetching layout:", error)

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
    if (!currentWarehouse) {
      console.log("❌ No current warehouse selected for saving")
      return
    }

    try {
      console.log("💾 Saving layout to API for warehouse:", currentWarehouse.id)

      const response = await fetch("/api/layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          layout: layoutToSave,
          warehouse_id: currentWarehouse.id,
          username: username || "Bilinmeyen Kullanıcı",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save layout")
      }

      console.log("Layout saved successfully for warehouse:", currentWarehouse.id)

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

      if (debouncedSaveTimeout) {
        clearTimeout(debouncedSaveTimeout)
      }

      const newTimeout = setTimeout(() => {
        console.log("⏰ Debounced save triggered for shelf:", updatedShelf.id)
        saveLayout(updatedLayout, true)
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

      saveLayout(updatedLayout)

      return updatedLayout
    })
  }

  const handleShelfDelete = async (shelfId: ShelfId) => {
    if (!currentWarehouse) {
      console.log("❌ No current warehouse selected for deletion")
      return
    }

    try {
      console.log("🗑️ Deleting shelf:", shelfId, "from warehouse:", currentWarehouse.id)

      const checkResponse = await fetch("/api/layout", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "checkProducts",
          shelfId,
          warehouse_id: currentWarehouse.id,
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
    const shelfName = prompt("Yeni raf için isim girin:")

    // If user cancels the prompt, don't create the shelf
    if (shelfName === null) {
      return
    }

    // If user enters empty name, show error
    if (!shelfName.trim()) {
      toast({
        title: "Hata",
        description: "Raf ismi boş olamaz.",
        variant: "destructive",
      })
      return
    }

    const finalShelfName = shelfName.trim()

    const existingShelf = layout?.shelves.find((shelf) => shelf.name === finalShelfName || shelf.id === finalShelfName)

    if (existingShelf) {
      toast({
        title: "Hata",
        description: "Bu isimde bir raf zaten mevcut.",
        variant: "destructive",
      })
      return
    }

    const uniqueId = `shelf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.log("➕ Adding new shelf with custom name:", finalShelfName)

    const newShelf: ShelfLayout = {
      id: uniqueId, // Unique technical ID
      x: 10,
      y: 10,
      width: 80,
      height: 60,
      rotation: 0,
      isCommon: false,
      name: finalShelfName, // User's custom name for display
    }

    setLayout((prevLayout) => {
      if (!prevLayout) return prevLayout

      const updatedLayout = {
        ...prevLayout,
        shelves: [...prevLayout.shelves, newShelf],
        updatedAt: Date.now(),
      }

      saveLayout(updatedLayout)

      return updatedLayout
    })

    toast({
      title: "Başarılı",
      description: `"${finalShelfName}" rafı eklendi.`,
    })
  }

  const handleSaveLayout = () => {
    if (layout) {
      console.log("💾 Manual save triggered")
      saveLayout(layout)
    }
  }

  const handleResetLayout = async () => {
    if (!currentWarehouse) {
      console.log("❌ No current warehouse selected for reset")
      return
    }

    try {
      console.log("🔄 Resetting layout for warehouse:", currentWarehouse.id)

      const response = await fetch(`/api/layout?warehouse_id=${currentWarehouse.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to reset layout")
      }

      console.log("Layout reset successfully for warehouse:", currentWarehouse.id)
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

  // Snap helper
  const snapValue = (val: number) =>
    snapEnabled ? Math.round(val / SNAP_GRID) * SNAP_GRID : Math.round(val * 10) / 10

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(3, parseFloat((z + 0.25).toFixed(2))))
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))
  const handleZoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.1 : -0.1
    setZoom((z) => Math.min(3, Math.max(0.5, parseFloat((z + delta).toFixed(2)))))
  }

  // Pan: middle mouse or Space+drag
  const handleMapMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault()
      setIsPanning(true)
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
    }
  }
  const handleMapMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !panStart.current) return
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    })
  }
  const handleMapMouseUp = () => { setIsPanning(false); panStart.current = null }

  const handleShelfClick = (shelfId: ShelfId) => {
    if (isSelectMode) {
      setSelectedShelves((prev) => {
        const next = new Set(prev)
        if (next.has(shelfId)) {
          next.delete(shelfId)
        } else {
          next.add(shelfId)
        }
        return next
      })
      return
    }
    if (isEditMode && !editingShelfId) {
      setPropShelfId((prev) => (prev === shelfId ? null : shelfId))
      return
    }
    if (!isEditMode && !editingShelfId) {
      setSelectedShelf(shelfId)
    }
  }

  const SHELF_COLORS: Record<string, string> = {
    A: "#6366f1", B: "#8b5cf6", C: "#ec4899", D: "#f43f5e",
    E: "#f97316", F: "#eab308", G: "#84cc16",
  }
  const LAYER_COLORS: Record<string, string> = {
    "üst kat": "#6366f1", "orta kat": "#8b5cf6", "alt kat": "#ec4899",
    "a önü": "#f43f5e", "b önü": "#f97316", "c önü": "#eab308",
    "mutfak yanı": "#84cc16", "tezgah yanı": "#14b8a6",
    "dayının alanı": "#3b82f6", "cam kenarı": "#06b6d4",
    "tuvalet önü": "#10b981", "merdiven tarafı": "#6d28d9",
  }

  const handleExportPdf = async () => {
    if (!currentWarehouse || selectedShelves.size === 0 || !layout) return
    setIsExportingPdf(true)

    try {
      // Fetch products for each selected shelf, grouped by layer
      const shelfDataArr = await Promise.all(
        Array.from(selectedShelves).map(async (shelfId) => {
          const shelf = layout.shelves.find((s) => s.id === shelfId)
          if (!shelf) return null
          // Get layers from local layout (no extra API call needed)
          const layers = getAvailableLayersForShelf(shelfId, layout)
          // Fetch products per layer
          const productsByLayer: Record<string, any[]> = {}
          await Promise.all(
            layers.map(async (layer) => {
              const r = await fetch(
                `/api/products?shelfId=${shelfId}&layer=${encodeURIComponent(layer)}&warehouse_id=${currentWarehouse.id}`,
                { headers: { "Cache-Control": "no-cache" } },
              )
              productsByLayer[layer] = r.ok ? (await r.json()).products || [] : []
            }),
          )
          return { shelf, productsByLayer }
        }),
      )

      const validShelfData = shelfDataArr.filter(Boolean) as { shelf: ShelfLayout; productsByLayer: Record<string, any[]> }[]
      const printDate = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })

      const shelvesHtml = validShelfData
        .map(({ shelf, productsByLayer }) => {
          const shelfColor = SHELF_COLORS[shelf.id] ?? "#94a3b8"
          const shelfName = shelf.name && shelf.name.trim() ? shelf.name : shelf.id
          const LAYER_ORDER = [
            "üst kat", "orta kat", "alt kat",
            "a önü", "b önü", "c önü",
            "mutfak yanı", "tezgah yanı", "dayının alanı",
            "cam kenarı", "tuvalet önü", "merdiven tarafı",
          ]
          const activeLayers = Object.keys(productsByLayer)
            .filter((l) => productsByLayer[l].length > 0)
            .sort((a, b) => {
              const ai = LAYER_ORDER.indexOf(a.toLowerCase())
              const bi = LAYER_ORDER.indexOf(b.toLowerCase())
              const aIdx = ai === -1 ? LAYER_ORDER.length : ai
              const bIdx = bi === -1 ? LAYER_ORDER.length : bi
              return aIdx - bIdx
            })
          const totalProducts = Object.values(productsByLayer).reduce((a, b) => a + b.length, 0)

          return `
            <div class="shelf-page">
              <div class="shelf-header" style="background:${shelfColor}">
                <div class="shelf-badge">${shelfName.substring(0, 2).toUpperCase()}</div>
                <div class="shelf-info">
                  <h2>${shelfName}</h2>
                  <div class="shelf-subtitle">${currentWarehouse.name} &bull; ${totalProducts} ürün &bull; ${activeLayers.length} aktif katman</div>
                </div>
              </div>
              <div class="shelf-meta">
                <span><strong>Raf ID:</strong> ${shelf.id}</span>
                <span><strong>Tarih:</strong> ${printDate}</span>
              </div>
              ${
                activeLayers.length === 0
                  ? `<div class="empty-shelf">Bu rafta kayıtlı ürün bulunmamaktadır.</div>`
                  : activeLayers
                      .map(
                        (layer) => `
                <div class="layer-section">
                  <div class="layer-header">
                    <div class="layer-dot" style="background:${LAYER_COLORS[layer.toLowerCase()] ?? "#94a3b8"}"></div>
                    <span class="layer-title">${layer.charAt(0).toUpperCase() + layer.slice(1)}</span>
                    <span class="layer-count">${productsByLayer[layer].length} ürün</span>
                  </div>
                  <table class="product-table">
                    <thead>
                      <tr>
                        <th>Ürün Adı</th>
                        <th>Kategori</th>
                        <th>Ölçü</th>
                        <th>Kilogram</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${productsByLayer[layer]
                        .map(
                          (p: any) => `
                        <tr>
                          <td>
                            <div class="product-name">${p.urunAdi}</div>
                            ${p.notlar ? `<div class="product-note">${p.notlar}</div>` : ""}
                          </td>
                          <td><span class="badge">${p.kategori}</span></td>
                          <td>${p.olcu}</td>
                          <td>${p.kilogram} kg</td>
                        </tr>
                      `,
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>
              `,
                      )
                      .join("")
              }
              <div class="shelf-footer">
                Depo Envanter Yönetim Sistemi &bull; ${currentWarehouse.name} &bull; Otomatik Oluşturuldu
              </div>
            </div>
          `
        })
        .join(`<div class="page-break"></div>`)

      const printWindow = window.open("", "_blank", "width=900,height=1000")
      if (!printWindow) return

      printWindow.document.write(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8"/>
  <title>${currentWarehouse.name} - Raf Etiketleri</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;color:#1a1a2e;padding:24px;}
    .shelf-page{max-width:720px;margin:0 auto 40px;border:2px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.08);}
    .shelf-header{color:#fff;padding:20px 24px;display:flex;align-items:center;gap:16px;}
    .shelf-badge{width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;flex-shrink:0;}
    .shelf-info h2{font-size:22px;font-weight:800;}
    .shelf-subtitle{font-size:13px;opacity:.85;margin-top:4px;}
    .shelf-meta{display:flex;justify-content:space-between;padding:10px 24px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;}
    .shelf-meta strong{color:#475569;}
    .layer-section{padding:16px 24px;border-bottom:1px solid #f1f5f9;}
    .layer-section:last-of-type{border-bottom:none;}
    .layer-header{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
    .layer-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;}
    .layer-title{font-size:13px;font-weight:700;color:#1e293b;text-transform:capitalize;}
    .layer-count{font-size:11px;color:#94a3b8;margin-left:auto;}
    .product-table{width:100%;border-collapse:collapse;font-size:12px;}
    .product-table th{text-align:left;padding:6px 8px;background:#f1f5f9;color:#64748b;font-weight:600;}
    .product-table td{padding:7px 8px;border-bottom:1px solid #f1f5f9;color:#334155;vertical-align:top;}
    .product-table tr:last-child td{border-bottom:none;}
    .product-name{font-weight:600;color:#1e293b;}
    .product-note{font-size:11px;color:#94a3b8;margin-top:2px;}
    .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;background:#f1f5f9;color:#64748b;}
    .shelf-footer{padding:12px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8;}
    .empty-shelf{padding:20px 24px;text-align:center;color:#94a3b8;font-style:italic;font-size:13px;}
    .page-break{page-break-after:always;height:0;}
    @media print{
      body{padding:0;background:#fff;}
      .shelf-page{border:none;border-radius:0;box-shadow:none;margin:0;}
    }
  </style>
</head>
<body>
  ${shelvesHtml}
  <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
</body>
</html>`)
      printWindow.document.close()
    } catch (err) {
      console.error("PDF export error:", err)
      toast({ title: "Hata", description: "PDF oluşturulurken bir hata oluştu.", variant: "destructive" })
    } finally {
      setIsExportingPdf(false)
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

  const confirmDeleteShelf = () => {
    if (!deleteConfirm || !currentWarehouse) return

    const { shelfId } = deleteConfirm

    setLayout((prevLayout) => {
      if (!prevLayout) return prevLayout

      console.log("🗑️ Deleting shelf from layout:", shelfId)

      // Remove the shelf from the layout
      const updatedLayout = {
        ...prevLayout,
        shelves: prevLayout.shelves.filter((shelf) => shelf.id !== shelfId),
        updatedAt: Date.now(),
      }

      // Save the updated layout
      saveLayout(updatedLayout)

      // Show success message
      toast({
        title: "Başarılı",
        description: `${shelfId} rafı başarıyla silindi.`,
      })

      return updatedLayout
    })

    // Close the confirmation dialog
    setDeleteConfirm({ open: false, shelfId: "", productCount: 0 })
  }

  if (isMigrationNeeded) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Grid className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Çoklu Depo Sistemi Kurulumu Gerekli</p>
            <p className="text-sm text-muted-foreground mb-4">
              Çoklu depo özelliğini kullanmak için migration script'lerini çalıştırmanız gerekiyor.
            </p>
            <p className="text-xs text-muted-foreground">
              Lütfen önce SQL script'ini, sonra TypeScript migration script'ini çalıştırın.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!currentWarehouse) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Grid className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Depo Seçilmedi</p>
            <p className="text-sm text-muted-foreground">Lütfen üst menüden bir depo seçin.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{currentWarehouse.name} layout'u yükleniyor...</p>
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
            {currentWarehouse.name} - Depo Yerleşim Planı
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isEditMode
              ? "Rafları sürükleyin, boyutlandırın, döndürün, isimlerini ve katmanlarını düzenleyin"
              : "Raf detaylarını görmek için tıklayın"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isEditMode ? "default" : "outline"} className="mr-2">
            {isSelectMode ? "Seçim Modu" : isEditMode ? "Düzenleme Modu" : "Görüntüleme Modu"}
          </Badge>

          {/* Select mode toggle */}
          {!isEditMode && (
            <Button
              variant={isSelectMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsSelectMode((v) => !v)
                setSelectedShelves(new Set())
              }}
              className={`flex items-center gap-2 ${isSelectMode ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" : ""}`}
              disabled={!!editingShelfId}
            >
              {isSelectMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              {isSelectMode ? "Seçimi Kapat" : "Raf Seç"}
            </Button>
          )}

          {/* PDF export button */}
          {isSelectMode && selectedShelves.size > 0 && (
            <Button
              size="sm"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileDown className="h-4 w-4" />
              {isExportingPdf ? "Hazırlanıyor..." : `${selectedShelves.size} Raf PDF`}
            </Button>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border border-border rounded-md px-1 py-0.5 bg-background">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Uzaklaştır"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleZoomReset}
              className="px-2 text-xs font-mono hover:bg-muted rounded transition-colors min-w-[3rem] text-center"
              title="Sıfırla"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Yaklaştır"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Snap toggle */}
          {isEditMode && (
            <button
              onClick={() => setSnapEnabled((v) => !v)}
              title={snapEnabled ? "Snap açık — kapat" : "Snap kapalı — aç"}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                snapEnabled
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-500"
                  : "bg-muted border-border text-muted-foreground"
              }`}
            >
              <Magnet className="h-3.5 w-3.5" />
              Snap
            </button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsEditMode(!isEditMode)
              if (!isEditMode) setPropShelfId(null)
              if (isSelectMode) {
                setIsSelectMode(false)
                setSelectedShelves(new Set())
              }
            }}
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

      {isSelectMode && (
        <div className="mb-3 flex justify-center">
          <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-2 shadow-sm">
            <CheckSquare className="h-3.5 w-3.5" />
            <span className="font-medium">Seçim Modu Aktif</span>
            <span className="opacity-75">•</span>
            <span className="opacity-90">
              {selectedShelves.size === 0
                ? "PDF almak istediğiniz raflara tıklayın"
                : `${selectedShelves.size} raf seçildi — "Raf PDF" butonuna basın`}
            </span>
          </div>
        </div>
      )}

      <div className={`flex gap-3 items-start ${isEditMode && propShelfId ? "max-w-6xl" : "max-w-5xl"} mx-auto`}>
        {/* Map container */}
        <div
          ref={mapContainerRef}
          className="relative flex-1 aspect-[5/3] bg-muted/20 rounded-lg overflow-hidden border border-border shadow-md"
          style={{ cursor: isPanning ? "grabbing" : "default" }}
          onWheel={handleWheel}
          onMouseDown={handleMapMouseDown}
          onMouseMove={handleMapMouseMove}
          onMouseUp={handleMapMouseUp}
          onMouseLeave={handleMapMouseUp}
        >
          {/* Zoomed & panned content */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            {/* Grid */}
            <div className="absolute inset-0 opacity-20">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #94a3b8 1px, transparent 1px),
                    linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
                  `,
                  backgroundSize: snapEnabled && isEditMode ? "2% 2%" : "20px 20px",
                }}
              />
            </div>

            {layout.shelves.map((shelf) => (
              <DraggableShelf
                key={shelf.id}
                shelf={shelf}
                isEditMode={isEditMode}
                isSelectMode={isSelectMode}
                isSelected={selectedShelves.has(shelf.id)}
                snapValue={snapValue}
                zoom={zoom}
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

          {/* Zoom hint */}
          <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground/50 pointer-events-none select-none">
            Scroll: Zoom &bull; Alt+Sürükle: Pan
          </div>
        </div>

        {/* Properties Panel */}
        {isEditMode && propShelfId && (() => {
          const propShelf = layout.shelves.find((s) => s.id === propShelfId)
          if (!propShelf) return null
          const update = (patch: Partial<ShelfLayout>) =>
            handleShelfUpdate({ ...propShelf, ...patch })
          return (
            <div className="w-64 shrink-0 rounded-lg border border-border bg-card shadow-md overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                  Raf Özellikleri
                </div>
                <button
                  onClick={() => setPropShelfId(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="p-3 space-y-3">
                {/* Shelf ID badge */}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold text-white ${
                    { A:"bg-indigo-500", B:"bg-violet-500", C:"bg-pink-500", D:"bg-rose-500", E:"bg-orange-500", F:"bg-yellow-500", G:"bg-lime-500" }[propShelf.id] ?? "bg-slate-500"
                  }`}>
                    {(propShelf.name || propShelf.id).substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{propShelf.name || propShelf.id}</p>
                    <p className="text-[10px] text-muted-foreground">ID: {propShelf.id}</p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Position */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Konum (%)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "X", key: "x" as const },
                      { label: "Y", key: "y" as const },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="text-[10px] text-muted-foreground mb-1 block">{label}</label>
                        <input
                          type="number"
                          min={0}
                          max={95}
                          step={snapEnabled ? SNAP_GRID : 0.5}
                          value={Math.round(propShelf[key] * 10) / 10}
                          onChange={(e) => update({ [key]: snapValue(parseFloat(e.target.value) || 0) })}
                          className="w-full text-xs bg-muted/40 border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Boyut (%)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Genişlik", key: "width" as const },
                      { label: "Yükseklik", key: "height" as const },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="text-[10px] text-muted-foreground mb-1 block">{label}</label>
                        <input
                          type="number"
                          min={5}
                          max={50}
                          step={snapEnabled ? SNAP_GRID : 0.5}
                          value={Math.round(propShelf[key] * 10) / 10}
                          onChange={(e) => update({ [key]: snapValue(parseFloat(e.target.value) || 5) })}
                          className="w-full text-xs bg-muted/40 border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Rotasyon</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[0, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        onClick={() => update({ rotation: deg })}
                        className={`flex-1 text-xs py-1.5 rounded border transition-colors ${
                          (propShelf.rotation ?? 0) === deg
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Quick actions */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { handleShelfDelete(propShelfId); setPropShelfId(null) }}
                    className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Sil
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

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
            fetchLayout()
          }}
        />
      )}
    </div>
  )
}

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
