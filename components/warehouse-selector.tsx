"use client"

import { useState } from "react"
import { Check, ChevronDown, Warehouse, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useWarehouse } from "@/lib/warehouse-context"
import { cn } from "@/lib/utils"

export function WarehouseSelector() {
  const { warehouses, currentWarehouse, setCurrentWarehouse, isLoading, error, isMigrationNeeded } = useWarehouse()
  const [isOpen, setIsOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Depolar yükleniyor...</span>
      </div>
    )
  }

  if (isMigrationNeeded) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <span className="text-sm text-orange-700">Migration gerekli</span>
      </div>
    )
  }

  if (!currentWarehouse || warehouses.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
        <Warehouse className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Depo bulunamadı</span>
      </div>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-2 h-auto rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: currentWarehouse.color_code }}
            />
            <Warehouse className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{currentWarehouse.name}</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {warehouses.map((warehouse) => (
          <DropdownMenuItem
            key={warehouse.id}
            onClick={() => {
              setCurrentWarehouse(warehouse)
              setIsOpen(false)
            }}
            className="flex items-center gap-3 p-3 cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-1">
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: warehouse.color_code }}
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{warehouse.name}</span>
                {warehouse.description && (
                  <span className="text-xs text-muted-foreground">{warehouse.description}</span>
                )}
              </div>
            </div>
            {currentWarehouse.id === warehouse.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
