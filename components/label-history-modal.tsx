"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Search, Trash2, ChevronLeft, ChevronRight, Eye, ChevronDown, ChevronUp, Download } from "lucide-react"
import { LabelService, OperationsService } from "@/utils/database-service"
import { PalletLabelPreview } from "./pallet-label-preview"

interface LabelHistoryModalProps {
  onClose: () => void
}

interface LabelHistoryItem {
  id: string
  pallet_number: number
  order_number?: string
  date: string
  receiver_info: string
  product_lines: any[]
  pallet_weight: number
  total_packages: number
  created_by: string
  created_at: string
}

export function LabelHistoryModal({ onClose }: LabelHistoryModalProps) {
  const [labels, setLabels] = useState<LabelHistoryItem[]>([])
  const [filteredLabels, setFilteredLabels] = useState<LabelHistoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedLabels, setExpandedLabels] = useState<Set<string>>(new Set())
  const [selectedLabel, setSelectedLabel] = useState<LabelHistoryItem | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const itemsPerPage = 5

  // Load labels on component mount
  useEffect(() => {
    const loadLabels = async () => {
      setLoading(true)
      const labelHistory = await LabelService.getLabelHistory(200) // Get more for better search
      setLabels(labelHistory)
      setFilteredLabels(labelHistory)
      setLoading(false)
    }
    loadLabels()
  }, [])

  // Filter labels based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLabels(labels)
    } else {
      const filtered = labels.filter((label) => {
        const searchLower = searchTerm.toLowerCase()
        return (
          label.pallet_number.toString().includes(searchLower) ||
          (label.order_number && label.order_number.toLowerCase().includes(searchLower)) ||
          label.receiver_info.toLowerCase().includes(searchLower) ||
          label.product_lines.some((line) => line.description?.toLowerCase().includes(searchLower)) ||
          label.created_by.toLowerCase().includes(searchLower)
        )
      })
      setFilteredLabels(filtered)
    }
    setCurrentPage(1) // Reset to first page when searching
  }, [searchTerm, labels])

  // Calculate pagination
  const totalPages = Math.ceil(filteredLabels.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentLabels = filteredLabels.slice(startIndex, endIndex)

  const handleDelete = async (id: string) => {
    const labelToDelete = labels.find((label) => label.id === id)

    if (window.confirm("Bu etiketi silmek istediğinizden emin misiniz?")) {
      const success = await LabelService.deleteLabel(id)
      if (success) {
        // Log the deletion to operations history
        if (labelToDelete) {
          const currentUser = localStorage.getItem("currentUser") || "Bilinmeyen"
          await OperationsService.logOperation({
            user_name: currentUser,
            action: "delete",
            machine_id: "label_system", // Use a special machine ID for label operations
            details: `Palet etiketi silindi - Palet #${labelToDelete.pallet_number}${labelToDelete.order_number ? ` (${labelToDelete.order_number})` : ""} - ${labelToDelete.receiver_info.split("\n")[0]}`,
            entry_data: labelToDelete,
          })
        }

        setLabels(labels.filter((label) => label.id !== id))
        // If current page becomes empty, go to previous page
        if (currentLabels.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
        }
      } else {
        alert("Etiket silinirken bir hata oluştu.")
      }
    }
  }

  const handleDownloadPDF = async (label: LabelHistoryItem) => {
    try {
      // Create a temporary div for rendering the label
      const tempDiv = document.createElement("div")
      tempDiv.style.position = "absolute"
      tempDiv.style.left = "-9999px"
      tempDiv.style.top = "-9999px"
      document.body.appendChild(tempDiv)

      // Convert label data to the format expected by PalletLabelPreview
      const labelData = {
        palletNumber: label.pallet_number,
        orderNumber: label.order_number || "",
        date: formatDate(label.date),
        receiverInfo: label.receiver_info,
        productLines: label.product_lines.map((line) => ({
          description: line.description || "",
          packages: line.packages?.toString() || "",
          quantity: line.quantity?.toString() || "",
        })),
        palletWeight: label.pallet_weight?.toString() || "",
        dispatchNote: label.product_lines.find((line) => line.dispatchNo)?.dispatchNo || "",
      }

      // Render the label component
      const { createRoot } = await import("react-dom/client")
      const root = createRoot(tempDiv)

      await new Promise<void>((resolve) => {
        root.render(
          <PalletLabelPreview
            ref={(ref) => {
              if (ref) {
                setTimeout(() => {
                  // Create print window
                  const printWindow = window.open("", "_blank")
                  if (!printWindow) {
                    alert(
                      "Pop-up blocker is preventing the print window from opening. Please allow pop-ups for this site.",
                    )
                    resolve()
                    return
                  }

                  const printContent = ref.innerHTML
                  const fileName = label.order_number
                    ? `Palet-Etiketi-${label.order_number}`
                    : `Palet-Etiketi-${label.pallet_number}`

                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>${fileName}</title>
                        <style>
                          body { 
                            margin: 0; 
                            padding: 20px; 
                            font-family: Arial, sans-serif; 
                            background: white;
                          }
                          @media print {
                            body { margin: 0; padding: 0; }
                            @page { margin: 0.5in; }
                          }
                          * { box-sizing: border-box; }
                          table { border-collapse: collapse; }
                          .bg-white { background-color: white !important; }
                          .text-black { color: black !important; }
                          .border-2 { border: 2px solid black; }
                          .border-black { border-color: black; }
                          .border-b-2 { border-bottom: 2px solid black; }
                          .border-r-2 { border-right: 2px solid black; }
                          .border-t-2 { border-top: 2px solid black; }
                          .border-l-2 { border-left: 2px solid black; }
                          .border-b { border-bottom: 1px solid black; }
                          .border-r { border-right: 1px solid black; }
                          .p-4 { padding: 1rem; }
                          .p-2 { padding: 0.5rem; }
                          .p-1 { padding: 0.25rem; }
                          .mb-1 { margin-bottom: 0.25rem; }
                          .mr-2 { margin-right: 0.5rem; }
                          .font-bold { font-weight: bold; }
                          .font-semibold { font-weight: 600; }
                          .text-xs { font-size: 0.75rem; }
                          .text-8xl { font-size: 6rem; line-height: 1; }
                          .flex { display: flex; }
                          .items-center { align-items: center; }
                          .justify-center { align-items: center; text-align: center; }
                          .text-center { text-align: center; }
                          .whitespace-pre-wrap { white-space: pre-wrap; }
                          .w-full { width: 100%; }
                          .w-1\\/2 { width: 50%; }
                          .w-2\\/3 { width: 66.666667%; }
                          .h-8 { height: 2rem; }
                          .relative { position: relative; }
                          .absolute { position: absolute; }
                          .top-1 { top: 0.25rem; }
                          .right-1 { right: 0.25rem; }
                          .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
                          .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
                          .space-y-1 > * + * { margin-top: 0.25rem; }
                          
                          .print\\:flex { display: flex !important; }
                          .print\\:flex-col { flex-direction: column !important; }
                          .print\\:items-center { align-items: center !important; }
                          .print\\:justify-center { justify-content: center !important; }
                          .print\\:text-center { text-align: center !important; }
                          .print\\:display-block { display: block !important; }
                          .print\\:margin-top-4 { margin-top: 1rem !important; }
                          .print\\:margin-0 { margin: 0 !important; }
                          .print\\:line-height-none { line-height: 1 !important; }
                          .print\\:text-9xl { font-size: 8rem !important; line-height: 1 !important; }
                          .print\\:mb-6 { margin-bottom: 1.5rem !important; }
                          .print\\:pt-12 { padding-top: 3rem !important; }
                          
                          .pallet-number-container {
                            display: flex !important;
                            flex-direction: column !important;
                            align-items: center !important;
                            justify-content: center !important;
                            height: 100% !important;
                            padding-top: 3rem !important;
                          }
                          
                          .pallet-number-title {
                            font-weight: bold !important;
                            margin-bottom: 1.5rem !important;
                            text-align: center !important;
                            display: block !important;
                          }
                          
                          .pallet-number-value {
                            font-size: 8rem !important;
                            font-weight: bold !important;
                            line-height: 1 !important;
                            text-align: center !important;
                            display: block !important;
                            margin: 0 !important;
                          }
                        </style>
                      </head>
                      <body>
                        ${printContent}
                      </body>
                    </html>
                  `)

                  printWindow.document.close()

                  printWindow.onload = () => {
                    setTimeout(() => {
                      printWindow.print()
                      printWindow.close()
                      resolve()
                    }, 500)
                  }
                }, 100)
              }
            }}
            labelData={labelData}
          />,
        )
      })

      // Cleanup
      document.body.removeChild(tempDiv)
      root.unmount()
    } catch (error) {
      console.error("PDF download error:", error)
      alert("PDF indirme sırasında bir hata oluştu. Lütfen tekrar deneyin.")
    }
  }

  const toggleExpanded = (labelId: string) => {
    const newExpanded = new Set(expandedLabels)
    if (newExpanded.has(labelId)) {
      newExpanded.delete(labelId)
    } else {
      newExpanded.add(labelId)
    }
    setExpandedLabels(newExpanded)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("tr-TR")
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("tr-TR")
    } catch {
      return dateString
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const renderPaginationButtons = () => {
    const buttons = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(i)}
          className={`w-8 h-8 p-0 ${
            i === currentPage ? "bg-blue-600 text-white" : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          }`}
        >
          {i}
        </Button>,
      )
    }

    return buttons
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="p-6 text-center">
            <div className="text-white">Etiket geçmişi yükleniyor...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-6xl h-[90vh] bg-slate-800 border-slate-700 flex flex-col">
        <CardHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg sm:text-xl font-bold text-white">
              Etiket Geçmişi ({filteredLabels.length} etiket)
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Palet no, sipariş no, alıcı veya ürün ara..."
              className="bg-slate-700 border-slate-600 text-white pl-10 h-10"
            />
          </div>
        </CardHeader>

        <CardContent className="flex-grow overflow-hidden flex flex-col">
          {/* Labels List */}
          <div className="flex-grow overflow-y-auto space-y-3 mb-4">
            {currentLabels.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                {searchTerm ? "Arama kriterlerine uygun etiket bulunamadı." : "Henüz etiket oluşturulmamış."}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {currentLabels.map((label) => {
                  const isExpanded = expandedLabels.has(label.id)
                  const visibleProducts = isExpanded ? label.product_lines : label.product_lines.slice(0, 3)
                  const hasMoreProducts = label.product_lines.length > 3

                  return (
                    <Card key={label.id} className="bg-slate-700/50 border-slate-600">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                              Palet #{label.pallet_number}
                            </Badge>
                            {label.order_number && (
                              <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                                {label.order_number}
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-slate-500 text-slate-300 text-xs">
                              {formatDate(label.date)}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadPDF(label)}
                              className="text-green-400 hover:text-green-300 hover:bg-green-900/20 h-6 w-6"
                              title="PDF İndir"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedLabel(label)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 h-6 w-6"
                              title="Detayları Görüntüle"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(label.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-6 w-6"
                              title="Sil"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-slate-400">Alıcı:</span>
                            <p className="text-white text-xs mt-1 line-clamp-2">{label.receiver_info}</p>
                          </div>

                          {label.product_lines && label.product_lines.length > 0 && (
                            <div>
                              <span className="text-slate-400">Ürünler:</span>
                              <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                                {visibleProducts.map((line, index) => (
                                  <div key={index} className="text-xs text-slate-300 bg-slate-800/50 p-2 rounded">
                                    <div className="font-medium">{line.description || "Açıklama yok"}</div>
                                    <div className="text-slate-400 mt-1">
                                      {line.packages && `${line.packages} koli`}
                                      {line.packages && line.quantity && " • "}
                                      {line.quantity && `${line.quantity} adet`}
                                      {line.dispatchNo && ` • İrsaliye: ${line.dispatchNo}`}
                                    </div>
                                  </div>
                                ))}

                                {hasMoreProducts && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleExpanded(label.id)}
                                    className="w-full text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 text-xs p-1"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="w-3 h-3 mr-1" />
                                        Daha az göster
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3 mr-1" />+{label.product_lines.length - 3} ürün
                                        daha...
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-2 border-t border-slate-600">
                            <span>Ağırlık: {label.pallet_weight || 0} kg</span>
                            <span>Toplam Koli: {label.total_packages || 0}</span>
                            <span>Oluşturan: {label.created_by}</span>
                          </div>

                          <div className="text-xs text-slate-500">{formatDateTime(label.created_at)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex-shrink-0 border-t border-slate-600 pt-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm text-slate-400">
                  <span className="hidden sm:inline">
                    Sayfa {currentPage} / {totalPages} • {filteredLabels.length} etiket
                  </span>
                  <span className="sm:hidden">
                    {startIndex + 1}-{Math.min(endIndex, filteredLabels.length)} / {filteredLabels.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="hidden sm:flex items-center gap-1">{renderPaginationButtons()}</div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Label Modal */}
      {selectedLabel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] bg-slate-800 border-slate-700 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-white">
                  Etiket Detayları - Palet #{selectedLabel.pallet_number}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownloadPDF(selectedLabel)}
                    variant="outline"
                    size="sm"
                    className="bg-green-600 border-green-500 text-white hover:bg-green-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF İndir
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedLabel(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="overflow-y-auto">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 text-sm">Palet Numarası</label>
                    <p className="text-white font-medium">{selectedLabel.pallet_number}</p>
                  </div>
                  {selectedLabel.order_number && (
                    <div>
                      <label className="text-slate-300 text-sm">Sipariş Numarası</label>
                      <p className="text-white font-medium">{selectedLabel.order_number}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-slate-300 text-sm">Tarih</label>
                    <p className="text-white font-medium">{formatDate(selectedLabel.date)}</p>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm">Oluşturan</label>
                    <p className="text-white font-medium">{selectedLabel.created_by}</p>
                  </div>
                </div>

                {/* Receiver Info */}
                <div>
                  <label className="text-slate-300 text-sm">Alıcı Bilgileri</label>
                  <div className="bg-slate-700 rounded-md p-3 mt-1">
                    <p className="text-white whitespace-pre-wrap">{selectedLabel.receiver_info}</p>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <label className="text-slate-300 text-sm">Ürünler ({selectedLabel.product_lines.length} adet)</label>
                  <div className="bg-slate-700 rounded-md p-3 mt-1 space-y-2 max-h-60 overflow-y-auto">
                    {selectedLabel.product_lines.map((line, index) => (
                      <div key={index} className="bg-slate-600 rounded p-2">
                        <div className="text-white font-medium">{line.description || "Açıklama yok"}</div>
                        <div className="text-slate-300 text-sm mt-1">
                          {line.packages && `Koli/Çuval: ${line.packages}`}
                          {line.packages && line.quantity && " • "}
                          {line.quantity && `Miktar: ${line.quantity} adet`}
                          {line.dispatchNo && (
                            <div className="text-slate-400 text-xs mt-1">İrsaliye No: {line.dispatchNo}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-600">
                  <div>
                    <label className="text-slate-300 text-sm">Palet Ağırlığı</label>
                    <p className="text-white font-medium">{selectedLabel.pallet_weight || 0} kg</p>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm">Toplam Koli</label>
                    <p className="text-white font-medium">{selectedLabel.total_packages || 0}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-500 pt-2 border-t border-slate-600">
                  Oluşturulma: {formatDateTime(selectedLabel.created_at)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hidden print component */}
      <div ref={printRef} className="hidden" />
    </div>
  )
}
