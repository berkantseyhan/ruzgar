"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus, Trash2, Printer, Calendar, Users, FileText, ChevronDown, Eye, EyeOff, RefreshCw } from "lucide-react"
import { PalletLabelPreview } from "./pallet-label-preview"
import { LabelService, CustomerService } from "@/utils/database-service"
import { LabelHistoryModal } from "./label-history-modal"
import { CustomerManagementModal } from "./customer-management-modal"

interface LabelGeneratorModalProps {
  onClose: () => void
}

interface ProductLine {
  id: number
  description: string
  packages: string
  quantity: string
}

interface Customer {
  id: string
  company_name: string
  address: string
}

// Function to format date from YYYY-MM-DD to DD/MM/YYYY
const formatDateToDDMMYYYY = (dateString: string): string => {
  if (!dateString) return ""
  const [year, month, day] = dateString.split("-")
  return `${day}/${month}/${year}`
}

// Function to format date from DD/MM/YYYY to YYYY-MM-DD
const formatDateToYYYYMMDD = (dateString: string): string => {
  if (!dateString) return ""
  const [day, month, year] = dateString.split("/")
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

// Function to validate DD/MM/YYYY format
const isValidDateFormat = (dateString: string): boolean => {
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  const match = dateString.match(regex)
  if (!match) return false

  const day = Number.parseInt(match[1])
  const month = Number.parseInt(match[2])
  const year = Number.parseInt(match[3])

  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  if (year < 1900 || year > 2100) return false

  const daysInMonth = new Date(year, month, 0).getDate()
  return day <= daysInMonth
}

export function LabelGeneratorModal({ onClose }: LabelGeneratorModalProps) {
  const [palletNumber, setPalletNumber] = useState<string>("")
  const [orderNumber, setOrderNumber] = useState<string>("")
  const [isLoadingOrderNumber, setIsLoadingOrderNumber] = useState(false)
  const [dateInput, setDateInput] = useState(formatDateToDDMMYYYY(new Date().toISOString().split("T")[0]))
  const [receiverInfo, setReceiverInfo] = useState("")
  const [palletWeight, setPalletWeight] = useState("")
  const [dispatchNote, setDispatchNote] = useState("") // New field for dispatch note
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [customerSearchText, setCustomerSearchText] = useState("")
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [productLines, setProductLines] = useState<ProductLine[]>([
    {
      id: 1,
      description: "",
      packages: "",
      quantity: "",
    },
  ])
  const [showLabelHistory, setShowLabelHistory] = useState(false)
  const [showCustomerManagement, setShowCustomerManagement] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  const componentRef = useRef<HTMLDivElement>(null)
  const customerInputRef = useRef<HTMLInputElement>(null)

  // Load customers on component mount
  useEffect(() => {
    const loadCustomers = async () => {
      const customerList = await CustomerService.getAllCustomers()
      setCustomers(customerList)
      setFilteredCustomers(customerList)
    }
    loadCustomers()
  }, [])

  // Filter customers based on search text
  useEffect(() => {
    if (!customerSearchText.trim()) {
      setFilteredCustomers(customers)
    } else {
      const filtered = customers.filter((customer) =>
        customer.company_name.toLowerCase().includes(customerSearchText.toLowerCase()),
      )
      setFilteredCustomers(filtered)
    }
  }, [customerSearchText, customers])

  // Generate order number - improved database-driven version
  const generateOrderNumber = async (force = false) => {
    // Eğer zaten sipariş numarası varsa ve force değilse, kullanıcıya sor
    if (orderNumber.trim() && !force) {
      const confirmed = window.confirm(
        "Mevcut sipariş numarası silinecek ve yenisi oluşturulacak. Devam etmek istiyor musunuz?",
      )
      if (!confirmed) return
    }

    setIsLoadingOrderNumber(true)
    try {
      console.log("Generating new order number...")
      const newOrderNumber = await LabelService.getNextOrderNumber()
      setOrderNumber(newOrderNumber)
      console.log("New order number set:", newOrderNumber)
    } catch (error) {
      console.error("Error generating order number:", error)
      // Fallback to old method
      const now = new Date()
      const year = now.getFullYear().toString().slice(-2)
      const month = (now.getMonth() + 1).toString().padStart(2, "0")
      const day = now.getDate().toString().padStart(2, "0")
      const time = now.getHours().toString().padStart(2, "0") + now.getMinutes().toString().padStart(2, "0")
      const fallbackOrderNo = `SIP${year}${month}${day}${time}`
      setOrderNumber(fallbackOrderNo)
      console.log("Used fallback order number:", fallbackOrderNo)
    } finally {
      setIsLoadingOrderNumber(false)
    }
  }

  // Auto-generate order number when component mounts
  useEffect(() => {
    const initializeOrderNumber = async () => {
      // Sadece sipariş numarası boşsa otomatik oluştur
      if (!orderNumber.trim()) {
        console.log("Component mounted, initializing order number...")
        await generateOrderNumber(true) // force = true
      }
    }

    initializeOrderNumber()
  }, []) // Sadece component mount olduğunda çalışsın

  const handleDateInputChange = (value: string) => {
    setDateInput(value)
  }

  const handleDateInputBlur = () => {
    if (dateInput.length === 8 && !dateInput.includes("/")) {
      const formatted = `${dateInput.slice(0, 2)}/${dateInput.slice(2, 4)}/${dateInput.slice(4, 8)}`
      if (isValidDateFormat(formatted)) {
        setDateInput(formatted)
      }
    } else if (dateInput.length === 6 && !dateInput.includes("/")) {
      const currentYear = new Date().getFullYear()
      const century = Math.floor(currentYear / 100) * 100
      const formatted = `${dateInput.slice(0, 2)}/${dateInput.slice(2, 4)}/${century + Number.parseInt(dateInput.slice(4, 6))}`
      if (isValidDateFormat(formatted)) {
        setDateInput(formatted)
      }
    }
  }

  const setToday = () => {
    const today = new Date().toISOString().split("T")[0]
    setDateInput(formatDateToDDMMYYYY(today))
  }

  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearchText(value)
    setShowCustomerDropdown(true)
    setSelectedCustomerId("")

    // Clear receiver info when searching
    if (!value.trim()) {
      setReceiverInfo("")
    }
  }

  const handleCustomerSelect = (customer: Customer) => {
    setCustomerSearchText(customer.company_name)
    setSelectedCustomerId(customer.id)
    setReceiverInfo(customer.address)
    setShowCustomerDropdown(false)
  }

  const handleCustomerInputFocus = () => {
    setShowCustomerDropdown(true)
  }

  const handleCustomerInputBlur = () => {
    // Delay hiding dropdown to allow clicking on options
    setTimeout(() => {
      setShowCustomerDropdown(false)
    }, 200)
  }

  const handleAddLine = () => {
    if (productLines.length < 10) {
      setProductLines([
        ...productLines,
        {
          id: Date.now(),
          description: "",
          packages: "",
          quantity: "",
        },
      ])
    }
  }

  const handleRemoveLine = (id: number) => {
    if (productLines.length > 1) {
      setProductLines(productLines.filter((line) => line.id !== id))
    }
  }

  const handleLineChange = (id: number, field: keyof Omit<ProductLine, "id">, value: string) => {
    setProductLines(productLines.map((line) => (line.id === id ? { ...line, [field]: value } : line)))
  }

  const handleGenerateOrderNumber = () => {
    generateOrderNumber(false) // Kullanıcı onayı iste
  }

  const handlePrint = async () => {
    if (!palletNumber.trim() || isNaN(Number(palletNumber))) {
      alert("Lütfen geçerli bir palet numarası girin!")
      return
    }

    if (!isValidDateFormat(dateInput)) {
      alert("Lütfen geçerli bir tarih girin (GG/AA/YYYY formatında)!")
      return
    }

    // Sipariş numarasının kullanılıp kullanılmadığını kontrol et
    if (orderNumber.trim()) {
      const isUsed = await LabelService.isOrderNumberUsed(orderNumber)
      if (isUsed) {
        const confirmed = window.confirm(
          `Sipariş numarası "${orderNumber}" daha önce kullanılmış. Yine de devam etmek istiyor musunuz?`,
        )
        if (!confirmed) {
          return
        }
      }
    }

    if (!componentRef.current) return

    try {
      // Create a new window for printing
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        alert("Pop-up blocker is preventing the print window from opening. Please allow pop-ups for this site.")
        return
      }

      // Get the content to print
      const printContent = componentRef.current.innerHTML

      // Dosya adını sipariş numarası ile oluştur
      const fileName = orderNumber ? `Palet-Etiketi-${orderNumber}` : `Palet-Etiketi-${palletNumber}`

      // Create the print document with enhanced CSS for PDF layout
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
            
            /* PDF için özel palet numarası düzeni */
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
            
            /* Palet numarası container için özel stil */
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

      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()

          // Save label data after successful print
          saveLabelData()
        }, 500)
      }
    } catch (error) {
      console.error("Print error:", error)
      alert("Yazdırma sırasında bir hata oluştu. Lütfen tekrar deneyin.")
    }
  }

  const saveLabelData = async () => {
    const palletNum = Number(palletNumber)

    // Validate pallet number
    if (!palletNumber.trim() || isNaN(palletNum) || palletNum <= 0) {
      alert("Geçerli bir palet numarası gerekli!")
      return false
    }

    const labelData = {
      pallet_number: palletNum,
      order_number: orderNumber,
      date: formatDateToYYYYMMDD(dateInput),
      receiver_info: receiverInfo.trim(),
      product_lines: productLines.filter(
        (line) => line.description.trim() || line.packages.trim() || line.quantity.trim(),
      ),
      pallet_weight: Number.parseFloat(palletWeight) || 0,
      total_packages: productLines.reduce((sum, line) => sum + (Number.parseInt(line.packages) || 0), 0),
      dispatch_note: dispatchNote.trim(), // Add dispatch note to saved data
      created_by: localStorage.getItem("currentUser") || "Bilinmeyen",
    }

    const success = await LabelService.saveLabel(labelData)

    if (success) {
      console.log("Label saved successfully")

      // Reset form for next label
      setPalletNumber("") // Just clear the field instead of auto-generating
      setDateInput(formatDateToDDMMYYYY(new Date().toISOString().split("T")[0]))
      setReceiverInfo("")
      setPalletWeight("")
      setDispatchNote("") // Reset dispatch note
      setSelectedCustomerId("")
      setCustomerSearchText("")
      setProductLines([
        {
          id: 1,
          description: "",
          packages: "",
          quantity: "",
        },
      ])

      // Yeni form için otomatik sipariş numarası oluştur
      setTimeout(async () => {
        console.log("Generating next order number after save...")
        await generateOrderNumber(true) // force = true, onay isteme
      }, 100)

      return true
    }

    return false
  }

  const labelData = {
    palletNumber: Number(palletNumber) || 0,
    orderNumber: orderNumber,
    date: dateInput,
    receiverInfo,
    productLines,
    palletWeight,
    dispatchNote, // Add dispatch note to label data
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-7xl h-[95vh] bg-slate-800 border-slate-700 flex flex-col">
        <CardHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg sm:text-xl font-bold text-white">Palet Etiketi Oluşturucu</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setShowCustomerManagement(true)}
                variant="outline"
                size="sm"
                className="bg-purple-600 border-purple-500 text-white hover:bg-purple-700 text-xs sm:text-sm"
              >
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Müşteriler</span>
                <span className="sm:hidden">Müşteri</span>
              </Button>
              <Button
                onClick={() => setShowLabelHistory(true)}
                variant="outline"
                size="sm"
                className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700 text-xs sm:text-sm"
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Geçmiş
              </Button>
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                size="sm"
                className="bg-green-600 border-green-500 text-white hover:bg-green-700 text-xs sm:text-sm lg:hidden"
              >
                {showPreview ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col lg:flex-row gap-4 overflow-hidden">
          {/* Form Section */}
          <div className={`${showPreview ? "lg:w-1/2" : "w-full"} flex flex-col gap-3 sm:gap-4 overflow-y-auto pr-2`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="palletNumber" className="text-white text-sm">
                  Palet Numarası
                </Label>
                <Input
                  id="palletNumber"
                  value={palletNumber}
                  onChange={(e) => setPalletNumber(e.target.value)}
                  placeholder="Palet numarasını girin"
                  className="bg-slate-700 border-slate-600 text-white h-10 sm:h-auto"
                />
              </div>
              <div>
                <Label htmlFor="orderNumber" className="text-white text-sm">
                  Sipariş Numarası
                  {isLoadingOrderNumber && <span className="text-yellow-400 ml-2">(Oluşturuluyor...)</span>}
                </Label>
                <div className="relative">
                  <Input
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="Sipariş numarası"
                    className="bg-slate-700 border-slate-600 text-white pr-12 h-10 sm:h-auto"
                    disabled={isLoadingOrderNumber}
                  />
                  <Button
                    type="button"
                    onClick={handleGenerateOrderNumber}
                    disabled={isLoadingOrderNumber}
                    className="absolute right-1 top-1 h-8 w-8 p-0 bg-slate-600 hover:bg-slate-500 text-white disabled:opacity-50"
                    size="sm"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingOrderNumber ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                {orderNumber && (
                  <p className="text-xs text-slate-400 mt-1">Veritabanından kontrol edilerek oluşturuldu</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="date" className="text-white text-sm">
                  Tarih (GG/AA/YYYY)
                </Label>
                <div className="relative">
                  <Input
                    id="date"
                    value={dateInput}
                    onChange={(e) => handleDateInputChange(e.target.value)}
                    onBlur={handleDateInputBlur}
                    className="bg-slate-700 border-slate-600 text-white pr-16 h-10 sm:h-auto"
                    placeholder="29/05/2025"
                  />
                  <Button
                    type="button"
                    onClick={setToday}
                    className="absolute right-1 top-1 h-8 px-2 bg-slate-600 hover:bg-slate-500 text-white text-xs"
                    size="sm"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Bugün</span>
                  </Button>
                </div>
                {dateInput && !isValidDateFormat(dateInput) && (
                  <p className="text-red-400 text-xs mt-1">Geçerli tarih formatı: GG/AA/YYYY</p>
                )}
              </div>
              <div>
                <Label htmlFor="palletWeight" className="text-white text-sm">
                  Palet Ağırlığı (KG)
                </Label>
                <Input
                  id="palletWeight"
                  value={palletWeight}
                  onChange={(e) => setPalletWeight(e.target.value)}
                  className="bg-slate-700 border-slate-600 h-10 sm:h-auto"
                  placeholder="Ağırlık girin"
                />
              </div>
            </div>

            {/* İrsaliye No - Palet ağırlığının altına eklendi */}
            <div>
              <Label htmlFor="dispatchNote" className="text-white text-sm">
                İrsaliye No
              </Label>
              <Input
                id="dispatchNote"
                value={dispatchNote}
                onChange={(e) => setDispatchNote(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white h-10 sm:h-auto"
                placeholder="İrsaliye numarası girin"
              />
            </div>

            {/* Customer Search */}
            <div className="relative">
              <Label className="text-white text-sm">Müşteri Seçimi</Label>
              <div className="relative">
                <Input
                  ref={customerInputRef}
                  value={customerSearchText}
                  onChange={(e) => handleCustomerSearchChange(e.target.value)}
                  onFocus={handleCustomerInputFocus}
                  onBlur={handleCustomerInputBlur}
                  placeholder="Müşteri adı yazın..."
                  className="bg-slate-700 border-slate-600 text-white pr-10 h-10 sm:h-auto"
                />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />

                {showCustomerDropdown && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-slate-700 border border-slate-600 rounded-md mt-1 max-h-48 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => handleCustomerSelect(customer)}
                          className="px-3 py-2 hover:bg-slate-600 cursor-pointer text-white text-sm border-b border-slate-600 last:border-b-0"
                        >
                          <div className="font-medium">{customer.company_name}</div>
                          <div className="text-xs text-slate-400 truncate">{customer.address}</div>
                        </div>
                      ))
                    ) : customerSearchText.trim() ? (
                      <div className="px-3 py-2 text-slate-400 text-sm">
                        Müşteri bulunamadı. Yeni müşteri eklemek için "Müşteriler" butonunu kullanın.
                      </div>
                    ) : (
                      <div className="px-3 py-2 text-slate-400 text-sm">Müşteri adı yazın...</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="receiverInfo" className="text-white text-sm">
                Alıcı Bilgileri
              </Label>
              <Textarea
                id="receiverInfo"
                value={receiverInfo}
                onChange={(e) => setReceiverInfo(e.target.value)}
                rows={3}
                className="bg-slate-700 border-slate-600 text-sm"
                placeholder="ŞA-RA ENERJİ SAN TİC A.Ş.&#10;CEYHAN YOLU ÜZERİ 30 KM&#10;YÜREĞİR / ADANA"
              />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-white border-b border-slate-600 pb-1">Ürünler</h3>
            </div>

            {productLines.map((line, index) => (
              <div key={line.id} className="p-2 sm:p-3 bg-slate-700/50 rounded-md space-y-2 relative">
                <div className="grid grid-cols-1 gap-2">
                  <Input
                    placeholder="Malzeme Açıklaması"
                    value={line.description}
                    onChange={(e) => handleLineChange(line.id, "description", e.target.value)}
                    className="bg-slate-600 border-slate-500 text-sm h-9 sm:h-auto"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Koli/Çuval"
                    value={line.packages}
                    onChange={(e) => handleLineChange(line.id, "packages", e.target.value)}
                    className="bg-slate-600 border-slate-500 text-sm h-9 sm:h-auto"
                  />
                  <Input
                    placeholder="Miktar/Adet"
                    value={line.quantity}
                    onChange={(e) => handleLineChange(line.id, "quantity", e.target.value)}
                    className="bg-slate-600 border-slate-500 text-sm h-9 sm:h-auto"
                  />
                </div>
                {productLines.length > 1 && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 sm:top-2 sm:right-2"
                    onClick={() => handleRemoveLine(line.id)}
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button onClick={handleAddLine} variant="outline" className="bg-slate-700 border-slate-600 text-sm h-10">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Yeni Satır Ekle
            </Button>

            <Button
              onClick={handlePrint}
              className="mt-auto bg-blue-600 hover:bg-blue-700 text-base sm:text-lg h-12 sm:h-14"
            >
              <Printer className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Etiketi Yazdır
            </Button>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="lg:w-1/2 w-full bg-gray-100 rounded-md overflow-hidden flex items-center justify-center min-h-[300px] lg:min-h-0">
              <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
                <div className="w-full max-w-md lg:max-w-none transform scale-75 sm:scale-90 lg:scale-100 origin-center">
                  <PalletLabelPreview ref={componentRef} labelData={labelData} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {showLabelHistory && <LabelHistoryModal onClose={() => setShowLabelHistory(false)} />}

      {showCustomerManagement && (
        <CustomerManagementModal
          onClose={() => setShowCustomerManagement(false)}
          onCustomerSaved={() => {
            // Müşteri listesini yenile
            const loadCustomers = async () => {
              const customerList = await CustomerService.getAllCustomers()
              setCustomers(customerList)
            }
            loadCustomers()
          }}
        />
      )}
    </div>
  )
}
