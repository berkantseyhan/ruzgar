"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Warehouse } from "./database"

interface WarehouseContextType {
  warehouses: Warehouse[]
  currentWarehouse: Warehouse | null
  setCurrentWarehouse: (warehouse: Warehouse) => void
  isLoading: boolean
  error: string | null
  refreshWarehouses: () => Promise<void>
  isMigrationNeeded: boolean
}

const WarehouseContext = createContext<WarehouseContextType | null>(null)

export function useWarehouse() {
  const context = useContext(WarehouseContext)
  if (!context) {
    throw new Error("useWarehouse must be used within a WarehouseProvider")
  }
  return context
}

interface WarehouseProviderProps {
  children: React.ReactNode
}

export function WarehouseProvider({ children }: WarehouseProviderProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMigrationNeeded, setIsMigrationNeeded] = useState(false)

  const fetchWarehouses = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setIsMigrationNeeded(false)

      const response = await fetch("/api/warehouses")

      if (!response.ok) {
        const errorText = await response.text()

        // Check if it's a database table missing error
        if (
          errorText.includes('relation "public.Depo_Ruzgar_Warehouses" does not exist') ||
          errorText.includes("Depolar yüklenirken hata")
        ) {
          console.log("Warehouses table not found - migration needed")
          setIsMigrationNeeded(true)
          setWarehouses([])
          setCurrentWarehouse(null)
          setError("Çoklu depo sistemi henüz kurulmamış. Lütfen migration script'lerini çalıştırın.")
          return
        }

        throw new Error("Failed to fetch warehouses")
      }

      const data = await response.json()
      const warehouseList = data.warehouses || []

      setWarehouses(warehouseList)

      // Set current warehouse from localStorage or default to first warehouse
      const savedWarehouseId = localStorage.getItem("currentWarehouseId")
      let selectedWarehouse = null

      if (savedWarehouseId) {
        selectedWarehouse = warehouseList.find((w: Warehouse) => w.id === savedWarehouseId)
      }

      if (!selectedWarehouse && warehouseList.length > 0) {
        selectedWarehouse = warehouseList[0]
      }

      if (selectedWarehouse) {
        setCurrentWarehouse(selectedWarehouse)
        localStorage.setItem("currentWarehouseId", selectedWarehouse.id)
      }
    } catch (err) {
      console.error("Error fetching warehouses:", err)
      setError(err instanceof Error ? err.message : "Failed to load warehouses")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetCurrentWarehouse = (warehouse: Warehouse) => {
    setCurrentWarehouse(warehouse)
    localStorage.setItem("currentWarehouseId", warehouse.id)
  }

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const value: WarehouseContextType = {
    warehouses,
    currentWarehouse,
    setCurrentWarehouse: handleSetCurrentWarehouse,
    isLoading,
    error,
    refreshWarehouses: fetchWarehouses,
    isMigrationNeeded,
  }

  return <WarehouseContext.Provider value={value}>{children}</WarehouseContext.Provider>
}
