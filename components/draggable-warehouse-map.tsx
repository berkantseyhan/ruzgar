"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import type { ShelfId, ShelfLayout, WarehouseLayout } from "@/lib/database"
import ShelfModal from "@/components/shelf-modal"
import ShelfLayersEditor from "@/components/shelf-layers-editor"
import ConfirmDialog from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Save, Lock, Unlock, Grid, Plus, Trash2, Edit3, Check, X, Layers, RotateCw, Printer } from "lucide-react"
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

  const handlePrintPDF = async () => {
    if (!layout || !currentWarehouse) return

    try {
      toast({
        title: "Hazırlanıyor",
        description: "PDF için ürün bilgileri yükleniyor...",
      })

      // Fetch products for each shelf
      const shelfProducts: Record<string, any[]> = {}
      
      for (const shelf of layout.shelves) {
        try {
          const response = await fetch(`/api/products?warehouse_id=${currentWarehouse.id}&shelf_id=${shelf.id}`)
          if (response.ok) {
            const data = await response.json()
            shelfProducts[shelf.id] = data.products || []
          } else {
            shelfProducts[shelf.id] = []
          }
        } catch (error) {
          console.error(`Error fetching products for shelf ${shelf.id}:`, error)
          shelfProducts[shelf.id] = []
        }
      }

      // Create print window
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast({
          title: "Hata",
          description: "Popup engelleyici aktif olabilir. Lütfen izin verin.",
          variant: "destructive",
        })
        return
      }

      // Generate HTML content for printing
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${currentWarehouse.name} - Raf Listesi</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 12px;
              line-height: 1.4;
            }
            .page {
              page-break-after: always;
              padding: 15mm;
              min-height: 100vh;
            }
            .page:last-child {
              page-break-after: auto;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #333;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .warehouse-name {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            .shelf-name {
              font-size: 32px;
              font-weight: bold;
              color: #000;
            }
            .shelf-info {
              font-size: 11px;
              color: #888;
              margin-top: 5px;
            }
            .layer-section {
              margin-bottom: 15px;
              border: 1px solid #ddd;
              border-radius: 5px;
              overflow: hidden;
            }
            .layer-header {
              background: #f5f5f5;
              padding: 8px 12px;
              font-weight: bold;
              font-size: 14px;
              border-bottom: 1px solid #ddd;
            }
            .product-list {
              padding: 10px;
            }
            .product-item {
              display: flex;
              justify-content: space-between;
              padding: 6px 8px;
              border-bottom: 1px solid #eee;
              align-items: center;
            }
            .product-item:last-child {
              border-bottom: none;
            }
            .product-name {
              font-weight: 500;
              font-size: 13px;
            }
            .product-details {
              color: #666;
              font-size: 11px;
            }
            .product-quantity {
              background: #e3f2fd;
              padding: 3px 8px;
              border-radius: 10px;
              font-weight: bold;
              font-size: 11px;
            }
            .empty-layer {
              text-align: center;
              padding: 15px;
              color: #999;
              font-style: italic;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 10px;
              color: #999;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            .summary {
              background: #f9f9f9;
              padding: 10px;
              border-radius: 5px;
              margin-bottom: 15px;
              display: flex;
              justify-content: space-around;
              text-align: center;
            }
            .summary-item {
              padding: 5px 15px;
            }
            .summary-value {
              font-size: 20px;
              font-weight: bold;
              color: #333;
            }
            .summary-label {
              font-size: 10px;
              color: #666;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${layout.shelves.map((shelf) => {
            const products = shelfProducts[shelf.id] || []
            const layers = shelf.customLayers || ['üst kat', 'orta kat', 'alt kat']
            const shelfDisplayName = shelf.name && shelf.name.trim() !== '' ? shelf.name : shelf.id
            
            // Group products by layer
            const productsByLayer: Record<string, any[]> = {}
            layers.forEach(layer => {
              productsByLayer[layer] = products.filter(p => p.layer === layer)
            })
            
            const totalProducts = products.length
            const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0)
            
            return `
              <div class="page">
                <div class="header">
                  <div class="warehouse-name">${currentWarehouse.name}</div>
                  <div class="shelf-name">${shelfDisplayName}</div>
                  <div class="shelf-info">${layers.length} katman</div>
                </div>
                
                <div class="summary">
                  <div class="summary-item">
                    <div class="summary-value">${totalProducts}</div>
                    <div class="summary-label">Toplam Ürün</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-value">${totalQuantity}</div>
                    <div class="summary-label">Toplam Adet</div>
                  </div>
                </div>
                
                ${layers.map(layer => `
                  <div class="layer-section">
                    <div class="layer-header">${layer}</div>
                    <div class="product-list">
                      ${productsByLayer[layer].length > 0 
                        ? productsByLayer[layer].map(product => `
                            <div class="product-item">
                              <div>
                                <div class="product-name">${product.name}</div>
                                <div class="product-details">
                                  ${product.category || ''} ${product.size ? '• ' + product.size : ''} ${product.weight ? '• ' + product.weight + ' kg' : ''}
                                </div>
                              </div>
                              <div class="product-quantity">${product.quantity || 0} adet</div>
                            </div>
                          `).join('')
                        : '<div class="empty-layer">Bu katmanda ürün yok</div>'
                      }
                    </div>
                  </div>
                `).join('')}
                
                <div class="footer">
                  Yazdırma Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}
                </div>
              </div>
            `
          }).join('')}
        </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print()
      }

      toast({
        title: "Hazır",
        description: "PDF yazdırma penceresi açıldı.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Hata",
        description: "PDF oluşturulurken bir hata oluştu.",
        variant: "destructive",
      })
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
            {isEditMode ? "Düzenleme Modu" : "Görüntüleme Modu"}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintPDF}
            className="flex items-center gap-2"
            title="Rafları PDF olarak yazdır"
          >
            <Printer className="h-4 w-4" />
            PDF Yazdır
          </Button>

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
