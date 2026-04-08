"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  TrendingUp,
  Target,
  Users,
  Filter,
  Download,
  Search,
  SortAsc,
  SortDesc,
  AlertTriangle,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ProductionService, LayoutService } from "@/utils/database-service"
import type { MachineTile } from "@/lib/supabase" // Assuming MachineTile type is in supabase.ts

// (Helper functions: formatDateToDDMMYYYY, formatDateToYYYYMMDD, isValidDateFormat remain the same)
const formatDateToDDMMYYYY = (dateString: string): string => {
  if (!dateString) return ""
  const [year, month, day] = dateString.split("-")
  return `${day}/${month}/${year}`
}
const formatDateToYYYYMMDD = (dateString: string): string => {
  if (!dateString) return ""
  const [day, month, year] = dateString.split("/")
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}
const isValidDateFormat = (dateString: string): boolean => {
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  const match = dateString.match(regex)
  if (!match) return false
  const day = Number.parseInt(match[1])
  const month = Number.parseInt(match[2])
  const year = Number.parseInt(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return false
  return day <= new Date(year, month, 0).getDate()
}

interface ProductionEntry {
  id: string
  date: string
  start_time?: string
  end_time?: string
  operator: string
  material: string
  product: string
  product_dimension: string
  pressedKg: number
  pressedPieces: number
  targetKg: number
  targetPieces: number
  customer: string
  notes: string
}

interface DetailedEntry extends ProductionEntry {
  machineId: string
  machineName: string
}

interface SummaryViewProps {
  onBack: () => void
}
interface MachineSummary {
  machineId: string
  machineName: string
  todayKg: number
  todayPieces: number
  monthlyKg: number
  monthlyPieces: number
  allTimeKg: number
  allTimePieces: number
  targetAchievement: number
  operators: string[]
  materials: string[]
  products: string[]
  customers: string[]
  entries: ProductionEntry[]
}
interface DetailedEntry extends ProductionEntry {
  machineId: string
  machineName: string
}

export function SummaryView({ onBack }: SummaryViewProps) {
  const [machineSummaries, setMachineSummaries] = useState<MachineSummary[]>([])
  const [allEntries, setAllEntries] = useState<DetailedEntry[]>([])
  const [viewMode, setViewMode] = useState<"summary" | "detailed">("summary")
  const [layoutTiles, setLayoutTiles] = useState<MachineTile[]>([]) // Add state for layout tiles

  const [dateFilter, setDateFilter] = useState("all")
  const [customDateFrom, setCustomDateFrom] = useState("")
  const [customDateTo, setCustomDateTo] = useState("")
  const [customDateFromDisplay, setCustomDateFromDisplay] = useState("")
  const [customDateToDisplay, setCustomDateToDisplay] = useState("")
  const [machineFilter, setMachineFilter] = useState<string[]>([])
  const [operatorFilter, setOperatorFilter] = useState("")
  const [materialFilter, setMaterialFilter] = useState("")
  const [productFilter, setProductFilter] = useState("")
  const [productDimensionFilter, setProductDimensionFilter] = useState("")
  const [customerFilter, setCustomerFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const [sortField, setSortField] = useState<"machine" | "todayKg" | "todayPieces" | "targetAchievement" | "date">(
    "machine",
  )
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const loadData = async () => {
      // Fetch layout first
      const currentLayoutTiles = await LayoutService.getActiveLayout()
      setLayoutTiles(currentLayoutTiles)

      const rawEntries = await ProductionService.getAllEntries()
      // Use a Set for faster lookups of machine IDs present in the layout
      const layoutMachineIds = new Set(currentLayoutTiles.map((tile) => tile.id))

      // Determine all unique machine IDs from both layout and entries
      const allMachineIdsFromEntries = new Set(rawEntries.map((entry) => entry.machine_id))
      const allUniqueMachineIds = new Set([...layoutMachineIds, ...allMachineIdsFromEntries])

      const today = new Date().toISOString().split("T")[0]
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const summaries: MachineSummary[] = []
      const detailedEntries: DetailedEntry[] = []

      allUniqueMachineIds.forEach((machineId) => {
        const tile = currentLayoutTiles.find((t) => t.id === machineId)
        // Use tile name if available, otherwise generate default or use machineId if not in default range
        let machineName: string
        if (tile) {
          machineName = tile.name
        } else {
          // Fallback for machines in entries but not in layout (e.g. if layout was reset/changed)
          const machineNumMatch = machineId.match(/\d+$/)
          if (machineNumMatch) {
            machineName = `Makine ${machineNumMatch[0]}`
          } else {
            machineName = machineId // Or some other default
          }
        }

        const machineEntries = rawEntries.filter((entry) => entry.machine_id === machineId)

        machineEntries.forEach((entry) => {
          detailedEntries.push({
            id: entry.id || "",
            date: entry.date,
            start_time: entry.start_time,
            end_time: entry.end_time,
            operator: entry.operator,
            material: entry.material,
            product: entry.product || "",
            product_dimension: entry.product_dimension || "",
            pressedKg: entry.pressed_kg,
            pressedPieces: entry.pressed_pieces,
            targetKg: entry.target_kg,
            targetPieces: entry.target_pieces,
            customer: entry.customer,
            notes: entry.notes,
            machineId,
            machineName, // Use the resolved machineName
          })
        })
        const todayEntries = machineEntries.filter((e) => e.date === today)
        const todayKg = todayEntries.reduce((s, e) => s + e.pressed_kg, 0)
        const todayPieces = todayEntries.reduce((s, e) => s + e.pressed_pieces, 0)
        const monthlyEntries = machineEntries.filter((e) => {
          const d = new Date(e.date)
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear
        })
        const monthlyKg = monthlyEntries.reduce((s, e) => s + e.pressed_kg, 0)
        const monthlyPieces = monthlyEntries.reduce((s, e) => s + e.pressed_pieces, 0)
        const allTimeKg = machineEntries.reduce((s, e) => s + e.pressed_kg, 0)
        const allTimePieces = machineEntries.reduce((s, e) => s + e.pressed_pieces, 0)
        const todayTargetKg = todayEntries.reduce((s, e) => s + e.target_kg, 0)
        const targetAchievement = todayTargetKg > 0 ? (todayKg / todayTargetKg) * 100 : 0

        summaries.push({
          machineId,
          machineName, // Use the resolved machineName
          todayKg,
          todayPieces,
          monthlyKg,
          monthlyPieces,
          allTimeKg,
          allTimePieces,
          targetAchievement,
          operators: [...new Set(machineEntries.map((e) => e.operator).filter(Boolean))],
          materials: [...new Set(machineEntries.map((e) => e.material).filter(Boolean))],
          products: [...new Set(machineEntries.map((e) => e.product).filter(Boolean))],
          customers: [...new Set(machineEntries.map((e) => e.customer).filter(Boolean))],
          entries: machineEntries.map((e) => ({
            ...e,
            id: e.id || "",
            product: e.product || "",
            product_dimension: e.product_dimension || "",
            pressedKg: e.pressed_kg,
            pressedPieces: e.pressed_pieces,
            targetKg: e.target_kg,
            targetPieces: e.target_pieces,
          })),
        })
      })
      setMachineSummaries(summaries)
      setAllEntries(detailedEntries)
    }
    loadData()
  }, []) // Removed machineSummaries from dependency array to prevent re-fetch loop

  // Get unique values for filters
  const uniqueOperators = useMemo(
    () => [...new Set(allEntries.map((e) => e.operator).filter(Boolean))].sort(),
    [allEntries],
  )

  const uniqueMaterials = useMemo(
    () => [...new Set(allEntries.map((e) => e.material).filter(Boolean))].sort(),
    [allEntries],
  )

  const uniqueProducts = useMemo(
    () => [...new Set(allEntries.map((e) => e.product).filter(Boolean))].sort(),
    [allEntries],
  )

  const uniqueProductDimensions = useMemo(
    () => [...new Set(allEntries.map((e) => e.product_dimension).filter(Boolean))].sort(),
    [allEntries],
  )

  const uniqueCustomers = useMemo(
    () => [...new Set(allEntries.map((e) => e.customer).filter(Boolean))].sort(),
    [allEntries],
  )

  const filteredData = useMemo(() => {
    let dataToFilter = viewMode === "summary" ? [...machineSummaries] : [...allEntries]
    // Apply date filter
    if (dateFilter !== "all") {
      const today = new Date().toISOString().split("T")[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

      if (viewMode === "summary") {
        dataToFilter = (dataToFilter as MachineSummary[])
          .map((summary) => {
            let filteredEntries = summary.entries
            if (dateFilter === "today") filteredEntries = summary.entries.filter((e) => e.date === today)
            else if (dateFilter === "week")
              filteredEntries = summary.entries.filter((e) => e.date >= weekAgo && e.date <= today)
            else if (dateFilter === "month")
              filteredEntries = summary.entries.filter((e) => e.date >= monthAgo && e.date <= today)
            else if (dateFilter === "custom")
              filteredEntries = summary.entries.filter(
                (e) => (!customDateFrom || e.date >= customDateFrom) && (!customDateTo || e.date <= customDateTo),
              )

            const todayEntries = filteredEntries.filter((e) => e.date === today)
            const todayKg = todayEntries.reduce((s, e) => s + e.pressedKg, 0)
            const todayPieces = todayEntries.reduce((s, e) => s + e.pressedPieces, 0)
            const monthlyKg = filteredEntries.reduce((s, e) => s + e.pressedKg, 0) // Represents filtered period
            const monthlyPieces = filteredEntries.reduce((s, e) => s + e.pressedPieces, 0)
            const todayTargetKg = todayEntries.reduce((s, e) => s + e.targetKg, 0)
            const filteredTargetKg = filteredEntries.reduce((s, e) => s + e.targetKg, 0)
            const filteredPressedKg = filteredEntries.reduce((s, e) => s + e.pressedKg, 0)
            const targetAchievement = filteredTargetKg > 0 ? (filteredPressedKg / filteredTargetKg) * 100 : 0
            return {
              ...summary,
              todayKg,
              todayPieces,
              monthlyKg,
              monthlyPieces,
              targetAchievement,
              entries: filteredEntries,
            }
          })
          .filter((summary) => summary.entries.length > 0)
      } else {
        dataToFilter = (dataToFilter as DetailedEntry[]).filter((entry) => {
          if (dateFilter === "today") return entry.date === today
          if (dateFilter === "week") return entry.date >= weekAgo && entry.date <= today
          if (dateFilter === "month") return entry.date >= monthAgo && entry.date <= today
          if (dateFilter === "custom")
            return (!customDateFrom || entry.date >= customDateFrom) && (!customDateTo || entry.date <= customDateTo)
          return true
        })
      }
    }
    // Apply other filters (machine, operator, material, product, dimension, customer, search)
    if (machineFilter.length > 0 && machineFilter.length < 15) {
      dataToFilter =
        viewMode === "summary"
          ? (dataToFilter as MachineSummary[]).filter((s) => machineFilter.includes(s.machineId))
          : (dataToFilter as DetailedEntry[]).filter((e) => machineFilter.includes(e.machineId))
    }
    // Operator filter
    const applyTextFilter = (items: any[], field: string, filterValue: string, isSummary: boolean) => {
      if (!filterValue.trim()) return items
      const lowerFilter = filterValue.toLowerCase().trim()
      return items.filter((item) =>
        isSummary
          ? (item as MachineSummary).entries.some((entry) => (entry as any)[field]?.toLowerCase().includes(lowerFilter))
          : (item as any)[field]?.toLowerCase().includes(lowerFilter),
      )
    }

    dataToFilter = applyTextFilter(dataToFilter, "operator", operatorFilter, viewMode === "summary")
    dataToFilter = applyTextFilter(dataToFilter, "material", materialFilter, viewMode === "summary")
    dataToFilter = applyTextFilter(dataToFilter, "product", productFilter, viewMode === "summary")
    dataToFilter = applyTextFilter(dataToFilter, "product_dimension", productDimensionFilter, viewMode === "summary")
    dataToFilter = applyTextFilter(dataToFilter, "customer", customerFilter, viewMode === "summary")

    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase().trim()
      dataToFilter = dataToFilter.filter((item) => {
        if (viewMode === "summary") {
          const s = item as MachineSummary
          return (
            s.machineName.toLowerCase().includes(lowerSearch) ||
            s.entries.some((e) => Object.values(e).some((val) => String(val).toLowerCase().includes(lowerSearch)))
          )
        } else {
          const e = item as DetailedEntry
          return Object.values(e).some((val) => String(val).toLowerCase().includes(lowerSearch))
        }
      })
    }

    // Sort
    if (viewMode === "summary") {
      ;(dataToFilter as MachineSummary[]).sort((a, b) => {
        let aVal: any, bVal: any
        if (sortField === "machine") {
          aVal = a.machineName
          bVal = b.machineName
        } else if (sortField === "todayKg") {
          aVal = a.todayKg
          bVal = b.todayKg
        } // Use monthlyKg for filtered period
        else if (sortField === "todayPieces") {
          aVal = a.todayPieces
          bVal = b.todayPieces
        } // Use monthlyPieces
        else if (sortField === "targetAchievement") {
          aVal = a.targetAchievement
          bVal = b.targetAchievement
        } else {
          aVal = a.machineName
          bVal = b.machineName
        }
        if (typeof aVal === "string")
          return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal
      })
    } else {
      // Detailed view
      ;(dataToFilter as DetailedEntry[]).sort((a, b) => {
        let aVal: any, bVal: any
        if (sortField === "date") {
          aVal = a.date
          bVal = b.date
        } else if (sortField === "machine") {
          aVal = a.machineName
          bVal = b.machineName
        }
        // Add more sort fields for detailed view if needed
        else {
          aVal = a.date + a.machineName
          bVal = b.date + b.machineName
        } // Default sort for detailed

        if (typeof aVal === "string")
          return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal
      })
    }
    return dataToFilter
  }, [
    machineSummaries,
    allEntries,
    viewMode,
    dateFilter,
    customDateFrom,
    customDateTo,
    machineFilter,
    operatorFilter,
    materialFilter,
    productFilter,
    productDimensionFilter,
    customerFilter,
    searchTerm,
    sortField,
    sortDirection,
  ])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, currentPage])
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  const filteredTotals = useMemo(() => {
    if (viewMode === "summary") {
      const summaries = filteredData as MachineSummary[]

      // Tüm makinelerin toplam değerlerini hesapla
      const totalPressedKg = summaries.reduce((s, item) => s + item.monthlyKg, 0)
      const totalTargetKg = summaries.reduce((s, item) => {
        // Her makinenin filtrelenmiş kayıtlarından hedef toplamını al
        return s + item.entries.reduce((entrySum, entry) => entrySum + entry.targetKg, 0)
      }, 0)

      return {
        totalKg: totalPressedKg,
        totalPieces: summaries.reduce((s, item) => s + item.monthlyPieces, 0),
        avgTargetAchievement: totalTargetKg > 0 ? (totalPressedKg / totalTargetKg) * 100 : 0,
        activeMachines: summaries.filter((s) => s.monthlyKg > 0).length,
        totalMachines: 15,
      }
    } else {
      const entries = filteredData as DetailedEntry[]
      const totalTargetKg = entries.reduce((s, e) => s + e.targetKg, 0)
      const totalPressedKg = entries.reduce((s, e) => s + e.pressedKg, 0)
      return {
        totalKg: totalPressedKg,
        totalPieces: entries.reduce((s, e) => s + e.pressedPieces, 0),
        avgTargetAchievement: totalTargetKg > 0 ? (totalPressedKg / totalTargetKg) * 100 : 0,
        activeMachines: new Set(entries.map((e) => e.machineId)).size,
        totalMachines: 15,
      }
    }
  }, [filteredData, viewMode])

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const replaceTurkishChars = (text: string): string =>
    text
      .replace(/[çÇ]/g, "c")
      .replace(/[ğĞ]/g, "g")
      .replace(/[ıİ]/g, "i")
      .replace(/[öÖ]/g, "o")
      .replace(/[şŞ]/g, "s")
      .replace(/[üÜ]/g, "u")

  const exportData = () => {
    let headers: string[]
    let rows: string[][]

    if (viewMode === "summary") {
      headers = ["Makine", "Bugun (kg)", "Bugun (Adet)", "Toplam (kg)", "Toplam (Adet)", "Hedef Basarisi"]
      rows = (filteredData as MachineSummary[]).map((s) => [
        replaceTurkishChars(s.machineName),
        String(s.todayKg),
        String(s.todayPieces),
        String(dateFilter === "all" ? s.allTimeKg : s.monthlyKg),
        String(dateFilter === "all" ? s.allTimePieces : s.monthlyPieces),
        `${s.targetAchievement.toFixed(1)}%`,
      ])
    } else {
      headers = [
        "Tarih",
        "Saat",
        "Makine",
        "Operator",
        "Urun",
        "Urun Olcusu",
        "Malzeme",
        "Basilan kg",
        "Basilan Adet",
        "Hedef kg",
        "Hedef Adet",
        "Musteri",
        "Notlar",
      ]
      rows = (filteredData as DetailedEntry[]).map((e) => [
        formatDateToDDMMYYYY(e.date),
        e.start_time && e.end_time ? `${e.start_time}-${e.end_time}` : "-",
        replaceTurkishChars(e.machineName),
        replaceTurkishChars(e.operator),
        replaceTurkishChars(e.product),
        replaceTurkishChars(e.product_dimension),
        replaceTurkishChars(e.material),
        String(e.pressedKg),
        String(e.pressedPieces),
        String(e.targetKg),
        String(e.targetPieces),
        replaceTurkishChars(e.customer),
        replaceTurkishChars(e.notes || ""),
      ])
    }

    // Use semicolon as separator for better Excel compatibility
    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n")

    // Add BOM for Excel UTF-8 compatibility
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" })

    // Generate dynamic filename based on filters
    const today = formatDateToDDMMYYYY(new Date().toISOString().split("T")[0])
    let filename = "uretim-raporu"

    // Add view mode
    filename += viewMode === "summary" ? "-ozet" : "-detay"

    // Add date filter info
    switch (dateFilter) {
      case "today":
        filename += `-bugun-${today.replace(/\//g, "-")}`
        break
      case "week":
        filename += `-son7gun-${today.replace(/\//g, "-")}`
        break
      case "month":
        filename += `-son30gun-${today.replace(/\//g, "-")}`
        break
      case "custom":
        if (customDateFrom && customDateTo) {
          filename += `-${formatDateToDDMMYYYY(customDateFrom).replace(/\//g, "-")}-${formatDateToDDMMYYYY(customDateTo).replace(/\//g, "-")}`
        } else if (customDateFrom) {
          filename += `-${formatDateToDDMMYYYY(customDateFrom).replace(/\//g, "-")}-sonrasi`
        } else if (customDateTo) {
          filename += `-${formatDateToDDMMYYYY(customDateTo).replace(/\//g, "-")}-oncesi`
        } else {
          filename += `-ozel-aralik`
        }
        break
      case "all":
        filename += "-tum-zamanlar"
        break
    }

    // Add machine filter info
    if (machineFilter.length > 0 && machineFilter.length < 15) {
      if (machineFilter.length === 1) {
        const machineNum = machineFilter[0].replace("machine", "")
        filename += `-makine${machineNum}`
      } else if (machineFilter.length <= 5) {
        const machineNums = machineFilter.map((id) => id.replace("machine", "")).sort((a, b) => Number(a) - Number(b))
        filename += `-makine${machineNums.join("-")}`
      } else {
        filename += `-${machineFilter.length}makine`
      }
    }

    // Add operator filter info
    if (operatorFilter.trim()) {
      const cleanOperator = replaceTurkishChars(operatorFilter.trim().toLowerCase().replace(/\s+/g, "-"))
      filename += `-op-${cleanOperator}`
    }

    // Add material filter info
    if (materialFilter.trim()) {
      const cleanMaterial = replaceTurkishChars(materialFilter.trim().toLowerCase().replace(/\s+/g, "-"))
      filename += `-mal-${cleanMaterial}`
    }

    // Add customer filter info
    if (customerFilter.trim()) {
      const cleanCustomer = replaceTurkishChars(customerFilter.trim().toLowerCase().replace(/\s+/g, "-"))
      filename += `-mus-${cleanCustomer}`
    }

    // Add search term info
    if (searchTerm.trim()) {
      const cleanSearch = replaceTurkishChars(searchTerm.trim().toLowerCase().replace(/\s+/g, "-"))
      filename += `-ara-${cleanSearch}`
    }

    // Add export date
    filename += `-${today.replace(/\//g, "-")}.csv`

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setDateFilter("all")
    setCustomDateFrom("")
    setCustomDateTo("")
    setCustomDateFromDisplay("")
    setCustomDateToDisplay("")
    setMachineFilter([])
    setOperatorFilter("")
    setMaterialFilter("")
    setProductFilter("")
    setProductDimensionFilter("")
    setCustomerFilter("")
    setSearchTerm("")
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            size="default"
            className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 px-3 py-2"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Dashboard'a Dön</span>
            <span className="sm:hidden">Geri</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Üretim Özeti</h1>
            <p className="text-sm sm:text-base text-slate-300">Performans analizi ve raporlama</p>
          </div>
        </div>
        <Button
          onClick={exportData}
          variant="outline"
          size="sm"
          className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 self-start sm:self-center"
        >
          <Download className="w-4 h-4 mr-2" />
          {viewMode === "summary" ? "Özeti İndir" : "Kayıtları İndir"}
        </Button>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6 flex gap-2">
        <Button
          onClick={() => setViewMode("summary")}
          variant={viewMode === "summary" ? "default" : "outline"}
          className={viewMode === "summary" ? "" : "bg-slate-800 border-slate-600 text-white hover:bg-slate-700"}
        >
          Makine Özeti
        </Button>
        <Button
          onClick={() => setViewMode("detailed")}
          variant={viewMode === "detailed" ? "default" : "outline"}
          className={viewMode === "detailed" ? "" : "bg-slate-800 border-slate-600 text-white hover:bg-slate-700"}
        >
          Detaylı Kayıtlar
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
            <Filter className="w-5 h-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Date Filter, Machine Filter, Operator Filter, General Search - these will stack on small screens */}
            <div>
              <Label className="text-white text-xs sm:text-sm font-semibold">Tarih Aralığı</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Bugün</SelectItem>
                  <SelectItem value="week">Son 7 Gün</SelectItem>
                  <SelectItem value="month">Son 30 Gün</SelectItem>
                  <SelectItem value="custom">Özel Aralık</SelectItem>
                  <SelectItem value="all">Tümü</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Machine Filter (simplified for brevity, full logic in original) */}
            <div>
              <Label className="text-white text-xs sm:text-sm font-semibold">Makine</Label>
              <Select
                value={
                  machineFilter.length === 0 || (layoutTiles.length > 0 && machineFilter.length === layoutTiles.length)
                    ? "all"
                    : "custom_machines"
                }
                onValueChange={(val) => {
                  if (val === "all")
                    setMachineFilter(layoutTiles.map((tile) => tile.id)) /* else handle custom selection */
                }}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-10 text-xs sm:text-sm">
                  <SelectValue>
                    {machineFilter.length === 0 ||
                    (layoutTiles.length > 0 && machineFilter.length === layoutTiles.length)
                      ? "Tüm Makineler"
                      : `${machineFilter.length} Makine Seçili`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/* ... Checkbox logic for machine selection ... */}
                  <div className="p-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id="select-all-machines-summary"
                        checked={layoutTiles.length > 0 && machineFilter.length === layoutTiles.length}
                        onCheckedChange={(checked) =>
                          setMachineFilter(checked ? layoutTiles.map((tile) => tile.id) : [])
                        }
                      />
                      <label htmlFor="select-all-machines-summary" className="text-xs sm:text-sm font-medium">
                        Tümünü Seç
                      </label>
                    </div>
                    <div className="border-t pt-2 max-h-48 overflow-y-auto">
                      {layoutTiles.length > 0 ? (
                        layoutTiles.map((tile) => (
                          <div key={tile.id} className="flex items-center space-x-2 py-1">
                            <Checkbox
                              id={`sum-${tile.id}`}
                              checked={machineFilter.includes(tile.id)}
                              onCheckedChange={(checked) =>
                                setMachineFilter((prev) =>
                                  checked ? [...prev, tile.id] : prev.filter((id) => id !== tile.id),
                                )
                              }
                            />
                            <label htmlFor={`sum-${tile.id}`} className="text-xs sm:text-sm">
                              {tile.name}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-xs p-2">Layout yüklenemedi veya boş.</p>
                      )}
                    </div>
                  </div>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white text-xs sm:text-sm font-semibold">Operatör</Label>
              <Input
                value={operatorFilter}
                onChange={(e) => setOperatorFilter(e.target.value)}
                placeholder="Operatör ara..."
                className="bg-slate-700 border-slate-600 text-white h-10 text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label className="text-white text-xs sm:text-sm font-semibold">Genel Arama</Label>
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3 sm:w-4 sm:h-4" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ara..."
                  className="bg-slate-700 border-slate-600 text-white pl-8 sm:pl-10 h-10 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>
          {dateFilter === "custom" /* Custom date inputs, similar responsive treatment */ && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-white text-xs sm:text-sm font-semibold">Başlangıç (GG/AA/YYYY)</Label>
                <Input
                  value={customDateFromDisplay}
                  onChange={(e) => {
                    setCustomDateFromDisplay(e.target.value)
                    if (isValidDateFormat(e.target.value)) setCustomDateFrom(formatDateToYYYYMMDD(e.target.value))
                  }}
                  onBlur={() => {
                    /* auto-format */
                  }}
                  className="bg-slate-700 border-slate-600 text-white h-10 text-xs sm:text-sm"
                  placeholder="18/05/2025"
                />
                {customDateFromDisplay && !isValidDateFormat(customDateFromDisplay) && (
                  <p className="text-red-400 text-xs mt-1">Geçerli format: GG/AA/YYYY</p>
                )}
              </div>
              <div>
                <Label className="text-white text-xs sm:text-sm font-semibold">Bitiş (GG/AA/YYYY)</Label>
                <Input
                  value={customDateToDisplay}
                  onChange={(e) => {
                    setCustomDateToDisplay(e.target.value)
                    if (isValidDateFormat(e.target.value)) setCustomDateTo(formatDateToYYYYMMDD(e.target.value))
                  }}
                  onBlur={() => {
                    /* auto-format */
                  }}
                  className="bg-slate-700 border-slate-600 text-white h-10 text-xs sm:text-sm"
                  placeholder="21/05/2025"
                />
                {customDateToDisplay && !isValidDateFormat(customDateToDisplay) && (
                  <p className="text-red-400 text-xs mt-1">Geçerli format: GG/AA/YYYY</p>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Product, Dimension, Material, Customer filters */}
            <div>
              <Label className="text-white text-xs sm:text-sm font-semibold">Ürün</Label>
              <Input
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                placeholder="Ürün ara..."
                className="bg-slate-700 border-slate-600 text-white h-10 text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label className="text-white text-xs sm:text-sm font-semibold">Ürün Ölçüsü</Label>
              <Input
                value={productDimensionFilter}
                onChange={(e) => setProductDimensionFilter(e.target.value)}
                placeholder="Ölçü ara..."
                className="bg-slate-700 border-slate-600 text-white h-10 text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label className="text-white text-xs sm:text-sm font-semibold">Malzeme</Label>
              <Input
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                placeholder="Malzeme ara..."
                className="bg-slate-700 border-slate-600 text-white h-10 text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label className="text-white text-xs sm:text-sm font-semibold">Müşteri</Label>
              <Input
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                placeholder="Müşteri ara..."
                className="bg-slate-700 border-slate-600 text-white h-10 text-xs sm:text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs sm:text-sm"
            >
              Filtreleri Temizle
            </Button>
            <Badge variant="secondary" className="bg-slate-700 text-white text-xs sm:text-sm">
              {filteredData.length} kayıt bulundu
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Cards will stack on small screens */}
        <Card className="bg-blue-600 border-blue-500">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              {dateFilter === "today"
                ? "Bugün Toplam"
                : dateFilter === "week"
                  ? "Son 7 Gün"
                  : dateFilter === "month"
                    ? "Son 30 Gün"
                    : dateFilter === "custom"
                      ? "Seçilen Dönem"
                      : "Tüm Zamanlar"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white">
              <div className="text-xl sm:text-2xl font-bold">{filteredTotals.totalKg.toFixed(1)} kg</div>
              <div className="text-blue-100 text-sm sm:text-base">
                {filteredTotals.totalPieces.toLocaleString()} adet
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-600 border-purple-500">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              Hedef Başarısı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white">
              <div className="text-xl sm:text-2xl font-bold">{filteredTotals.avgTargetAchievement.toFixed(1)}%</div>
              <div className="text-purple-100 text-sm sm:text-base">Ortalama</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-600 border-orange-500">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              Aktif Makine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white">
              <div className="text-xl sm:text-2xl font-bold">{filteredTotals.activeMachines}</div>
              <div className="text-orange-100 text-sm sm:text-base">/ {filteredTotals.totalMachines} toplam</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg sm:text-xl">
            {viewMode === "summary" ? "Makine Detayları" : "Detaylı Üretim Kayıtları"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px] sm:min-w-full">
              <TableHeader>
                <TableRow className="border-slate-600">
                  {viewMode === "summary" ? (
                    <>
                      <TableHead className="text-slate-300 text-xs sm:text-base">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("machine")}
                          className="text-slate-300 hover:text-white p-0 h-auto font-semibold text-xs sm:text-sm"
                        >
                          Makine
                          {sortField === "machine" &&
                            (sortDirection === "asc" ? (
                              <SortAsc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                            ) : (
                              <SortDesc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                            ))}
                        </Button>
                      </TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-base">
                        {dateFilter === "today"
                          ? "Bugün (kg)"
                          : dateFilter === "week"
                            ? "Son 7 Gün (kg)"
                            : dateFilter === "month"
                              ? "Son 30 Gün (kg)"
                              : dateFilter === "custom"
                                ? "Dönem (kg)"
                                : "Toplam (kg)"}
                      </TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-base">
                        {dateFilter === "today"
                          ? "Bugün (Adet)"
                          : dateFilter === "week"
                            ? "Son 7 Gün (Adet)"
                            : dateFilter === "month"
                              ? "Son 30 Gün (Adet)"
                              : dateFilter === "custom"
                                ? "Dönem (Adet)"
                                : "Toplam (Adet)"}
                      </TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-base">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("targetAchievement")}
                          className="text-slate-300 hover:text-white p-0 h-auto font-semibold text-xs sm:text-sm"
                        >
                          Hedef Başarısı
                          {sortField === "targetAchievement" &&
                            (sortDirection === "asc" ? (
                              <SortAsc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                            ) : (
                              <SortDesc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                            ))}
                        </Button>
                      </TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-base">Durum</TableHead>
                    </> /* Detailed View Headers */
                  ) : (
                    <>
                      <TableHead className="text-slate-300 text-xs sm:text-base">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("date")}
                          className="text-slate-300 hover:text-white p-0 h-auto font-semibold text-xs sm:text-sm"
                        >
                          Tarih
                          {sortField === "date" &&
                            (sortDirection === "asc" ? (
                              <SortAsc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                            ) : (
                              <SortDesc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                            ))}
                        </Button>
                      </TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-base">Saat</TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-base">Makine</TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-base">Operatör</TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-base">Ürün</TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-base hidden md:table-cell">Ölçü</TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-base hidden lg:table-cell">
                        Malzeme
                      </TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-base">Üretim (kg)</TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-base">Üretim (Adet)</TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-base hidden md:table-cell">
                        Hedef (kg)
                      </TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-base hidden lg:table-cell">
                        Müşteri
                      </TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-base hidden xl:table-cell">Notlar</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewMode === "summary"
                  ? (paginatedData as MachineSummary[]).map((summary) => (
                      <TableRow key={summary.machineId} className="border-slate-600">
                        <TableCell className="text-white font-semibold text-xs sm:text-base">
                          {summary.machineName}
                        </TableCell>
                        <TableCell className="text-white text-xs sm:text-base">
                          {summary.monthlyKg.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-white text-xs sm:text-base">
                          {summary.monthlyPieces.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-white text-xs sm:text-base">
                          <span
                            className={`font-semibold ${summary.targetAchievement >= 100 ? "text-green-400" : summary.targetAchievement >= 80 ? "text-yellow-400" : "text-red-400"}`}
                          >
                            {summary.targetAchievement.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {summary.monthlyKg > 0 ? (
                              <Badge className="bg-green-600 text-white text-xs">Aktif</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-slate-600 text-white text-xs">
                                Pasif
                              </Badge>
                            )}
                            {summary.targetAchievement < 50 && summary.monthlyKg > 0 && (
                              <Badge variant="destructive" className="bg-red-600 text-white text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Düşük
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  : (paginatedData as DetailedEntry[]).map((entry) => (
                      <TableRow key={entry.id} className="border-slate-600">
                        <TableCell className="text-white text-xs sm:text-base">
                          {formatDateToDDMMYYYY(entry.date)}
                        </TableCell>
                        <TableCell className="text-white text-xs sm:text-base">
                          {entry.start_time && entry.end_time ? `${entry.start_time}-${entry.end_time}` : "-"}
                        </TableCell>
                        <TableCell className="text-white text-xs sm:text-base">{entry.machineName}</TableCell>
                        <TableCell className="text-white text-xs sm:text-base truncate max-w-[100px] sm:max-w-[150px]">
                          {entry.operator}
                        </TableCell>
                        <TableCell className="text-white text-xs sm:text-base truncate max-w-[100px] sm:max-w-[150px]">
                          {entry.product}
                        </TableCell>
                        <TableCell className="text-white text-xs sm:text-base hidden md:table-cell">
                          {entry.product_dimension || "-"}
                        </TableCell>
                        <TableCell className="text-white text-xs sm:text-base hidden lg:table-cell">
                          {entry.material}
                        </TableCell>
                        <TableCell className="text-white text-xs sm:text-base">{entry.pressedKg}</TableCell>
                        <TableCell className="text-white text-xs sm:text-base">{entry.pressedPieces}</TableCell>
                        <TableCell className="text-white text-xs sm:text-base hidden md:table-cell">
                          {entry.targetKg}
                        </TableCell>
                        <TableCell className="text-white text-xs sm:text-base hidden lg:table-cell">
                          {entry.customer}
                        </TableCell>
                        <TableCell
                          className="text-white text-xs sm:text-base hidden xl:table-cell whitespace-pre-wrap" // Removed truncate and max-w, added whitespace-pre-wrap
                          title={entry.notes}
                        >
                          {entry.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
              <div className="text-slate-300 text-xs sm:text-sm">
                Sayfa {currentPage} / {totalPages} ({filteredData.length} toplam kayıt)
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs sm:text-sm"
                >
                  Önceki
                </Button>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs sm:text-sm"
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
