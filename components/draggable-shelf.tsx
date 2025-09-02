"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

interface Shelf {
  x: number
  y: number
  width: number
  height: number
}

interface DraggableShelfProps {
  shelf: Shelf
  onUpdate: (shelf: Shelf) => void
  onFinalUpdate: (shelf: Shelf) => void
}

const DraggableShelf: React.FC<DraggableShelfProps> = ({ shelf, onUpdate, onFinalUpdate }) => {
  const shelfRef = useRef<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPosition, setInitialPosition] = useState({ x: shelf.x, y: shelf.y })
  const [initialSize, setInitialSize] = useState({ width: shelf.width, height: shelf.height })

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
      if ((isDragging || isResizing) && onUpdate) {
        // Trigger final update with logging when drag/resize operation completes
        setTimeout(() => {
          if (onFinalUpdate) {
            onFinalUpdate(shelf)
          }
        }, 50)
      }
      setIsDragging(false)
      setIsResizing(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isResizing, isEditMode, isEditingName, shelf, onUpdate, onFinalUpdate])

  return (
    <div
      ref={shelfRef}
      style={{
        position: "absolute",
        left: `${shelf.x}%`,
        top: `${shelf.y}%`,
        width: `${shelf.width}%`,
        height: `${shelf.height}%`,
        backgroundColor: "lightblue",
        border: "1px solid blue",
      }}
    >
      {/* Shelf content */}
    </div>
  )
}

export default DraggableShelf
