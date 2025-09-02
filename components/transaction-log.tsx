"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RefreshCw, Search, Download, Loader2, Filter, Calendar, Clock, User, Edit, LogIn, LogOut } from "lucide-react"
import type { TransactionLog } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { convertHeadersForCSV } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { JSX } from "react"

export default function TransactionLogComponent() {
  const [logs, setLogs] = useState<TransactionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/logs")
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (err) {
      console.error("Error fetching logs:", err)
      setError(err instanceof Error ? err.message : "İşlem geçmişi yüklenirken bir hata oluştu")
      toast({
        title: "Hata",
        description: "İşlem geçmişi yüklenirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()

    // Set up polling for real-time updates
    const interval = setInterval(fetchLogs, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Make sure logs are sorted by timestamp (newest first)
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp)

  const filteredLogs = sortedLogs.filter(
    (log) =>
      log.urunAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.rafNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.katman.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.username && log.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.changes && JSON.stringify(log.changes).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.productDetails && JSON.stringify(log.productDetails).toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date)
  }

  const getActionTypeClass = (actionType: string) => {
    switch (actionType) {
      case "Ekleme":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "Güncelleme":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "Silme":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "Giriş":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
      case "Çıkış":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case "Giriş":
        return <LogIn className="h-3 w-3" />
      case "Çıkış":
        return <LogOut className="h-3 w-3" />
      default:
        return <Edit className="h-3 w-3" />
    }
  }

  // Helper function to format field name for display
  const formatFieldName = (fieldName: string): string => {
    const fieldNameMap: Record<string, string> = {
      urunAdi: "Ürün Adı",
      kategori: "Kategori",
      olcu: "Ölçü",
      rafNo: "Raf No",
      katman: "Katman",
      kilogram: "Kilogram",
      notlar: "Notlar",
    }
    return fieldNameMap[fieldName] || fieldName
  }

  // Helper function to format field value for display
  const formatFieldValue = (field: string, value: string | number): string => {
    if (field === "kilogram") {
      return `${value} kg`
    }
    return String(value)
  }

  // Format changes for display
  const formatChanges = (log: TransactionLog): JSX.Element => {
    // For login/logout actions, show session info
    if ((log.actionType === "Giriş" || log.actionType === "Çıkış") && log.sessionInfo) {
      const sessionInfo = log.sessionInfo
      return (
        <div className="space-y-1">
          <div className="text-xs">
            <Badge
              variant="outline"
              className={`mr-1 ${
                log.actionType === "Giriş"
                  ? "bg-emerald-50 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-800"
                  : "bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-800"
              }`}
            >
              {log.actionType === "Giriş" ? "Oturum Açıldı" : "Oturum Kapatıldı"}
            </Badge>
            {sessionInfo.loginTime && log.actionType === "Giriş" && (
              <span className="font-mono bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded text-xs">
                {formatDate(sessionInfo.loginTime)}
              </span>
            )}
            {sessionInfo.logoutTime && log.actionType === "Çıkış" && (
              <span className="font-mono bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-1.5 py-0.5 rounded text-xs">
                Süre:{" "}
                {sessionInfo.loginTime ? Math.round((sessionInfo.logoutTime - sessionInfo.loginTime) / 60000) : "?"} dk
              </span>
            )}
          </div>
          {sessionInfo.ipAddress && <div className="text-xs text-muted-foreground">IP: {sessionInfo.ipAddress}</div>}
        </div>
      )
    }

    // For update actions, show field changes
    if (log.actionType === "Güncelleme" && log.changes && log.changes.length > 0) {
      return (
        <div className="space-y-1">
          {log.changes.map((change, index) => (
            <div key={index} className="text-xs">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="mr-1 bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800"
                    >
                      {formatFieldName(change.field)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Değiştirilen alan</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="font-mono bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-1.5 py-0.5 rounded">
                {formatFieldValue(change.field, change.oldValue)} → {formatFieldValue(change.field, change.newValue)}
              </span>
            </div>
          ))}
        </div>
      )
    }

    // For add actions, show product details
    else if (log.actionType === "Ekleme" && log.productDetails) {
      const details = log.productDetails
      return (
        <div className="text-xs">
          <span className="font-medium text-green-700 dark:text-green-400">Eklendi: </span>
          <span className="font-mono bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-1.5 py-0.5 rounded">
            {details.urunAdi} | {details.kilogram} kg | {details.olcu} ölçü | Raf: {details.rafNo} | Katman:{" "}
            {details.katman}
          </span>
        </div>
      )
    }

    // For delete actions, show product details
    else if (log.actionType === "Silme" && log.productDetails) {
      const details = log.productDetails
      return (
        <div className="text-xs">
          <span className="font-medium text-red-700 dark:text-red-400">Silindi: </span>
          <span className="font-mono bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-1.5 py-0.5 rounded">
            {details.urunAdi} | {details.kilogram} kg | {details.olcu} ölçü | Raf: {details.rafNo} | Katman:{" "}
            {details.katman}
          </span>
        </div>
      )
    }

    // Default case
    return <span className="text-muted-foreground text-sm">-</span>
  }

  // Format changes for CSV export
  const formatChangesForCSV = (log: TransactionLog): string => {
    // For login/logout actions
    if ((log.actionType === "Giriş" || log.actionType === "Çıkış") && log.sessionInfo) {
      const sessionInfo = log.sessionInfo
      let result = log.actionType === "Giriş" ? "Oturum Açıldı" : "Oturum Kapatıldı"
      if (sessionInfo.ipAddress) {
        result += ` (IP: ${sessionInfo.ipAddress})`
      }
      if (sessionInfo.loginTime && sessionInfo.logoutTime && log.actionType === "Çıkış") {
        const duration = Math.round((sessionInfo.logoutTime - sessionInfo.loginTime) / 60000)
        result += ` - Süre: ${duration} dk`
      }
      return result
    }

    // For update actions, show field changes
    if (log.actionType === "Güncelleme" && log.changes && log.changes.length > 0) {
      return log.changes
        .map(
          (change) =>
            `${formatFieldName(change.field)}: ${formatFieldValue(change.field, change.oldValue)} → ${formatFieldValue(change.field, change.newValue)}`,
        )
        .join("; ")
    }

    // For add actions, show product details
    else if (log.actionType === "Ekleme" && log.productDetails) {
      const details = log.productDetails
      return `Eklendi: ${details.urunAdi} | ${details.kilogram} kg | ${details.olcu} ölçü | Raf: ${details.rafNo} | Katman: ${details.katman}`
    }

    // For delete actions, show product details
    else if (log.actionType === "Silme" && log.productDetails) {
      const details = log.productDetails
      return `Silindi: ${details.urunAdi} | ${details.kilogram} kg | ${details.olcu} ölçü | Raf: ${details.rafNo} | Katman: ${details.katman}`
    }

    return "-"
  }

  const handleExportCSV = () => {
    try {
      // Define headers with Turkish characters
      const turkishHeaders = [
        "Tarih",
        "İşlem Türü",
        "Raf No",
        "Katman",
        "Ürün Adı",
        "Değişiklik Detayları",
        "Kullanıcı",
      ]

      // Convert headers to Latin equivalents
      const latinHeaders = convertHeadersForCSV(turkishHeaders)

      // Create CSV rows with semicolon separator
      const csvRows = [
        latinHeaders.join(";"),
        ...filteredLogs.map((log) =>
          [
            formatDate(log.timestamp).replace(/;/g, ","),
            log.actionType.replace(/;/g, ","),
            log.rafNo.replace(/;/g, ","),
            log.katman.replace(/;/g, ","),
            log.urunAdi.replace(/;/g, ","),
            formatChangesForCSV(log).replace(/;/g, ","),
            (log.username || "Bilinmeyen Kullanici").replace(/;/g, ","),
          ].join(";"),
        ),
      ]

      const csvContent = csvRows.join("\r\n") // Use Windows line endings for better Excel compatibility

      // Create a blob with UTF-8 BOM for Excel compatibility
      const BOM = "\uFEFF"
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `islem-gecmisi-${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Başarılı",
        description: "İşlem geçmişi CSV olarak indirildi.",
      })
    } catch (error) {
      console.error("CSV export error:", error)
      toast({
        title: "Hata",
        description: "CSV dışa aktarımı sırasında bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full shadow-md border transition-shadow duration-200">
      <CardHeader className="bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-md">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              İşlem Geçmişi
            </CardTitle>
            <CardDescription>Tüm kullanıcı aktiviteleri ve ürün işlemlerinin kaydı</CardDescription>
          </div>
          <Badge variant="outline" className="font-normal">
            {filteredLogs.length} kayıt
          </Badge>
        </div>
        <div className="flex items-center justify-between mt-4 gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Ara..."
              className="pl-8 transition-colors duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchLogs}
              disabled={loading}
              className="transition-colors duration-200 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="sr-only">Yenile</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
              className="transition-colors duration-200 bg-transparent"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">CSV İndir</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading && logs.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-40 gap-3 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">İşlem geçmişi yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive bg-destructive/10 m-6 rounded-lg border border-destructive/20">
            <p className="font-medium">{error}</p>
            <Button onClick={fetchLogs} className="mt-4 bg-transparent" variant="outline">
              Tekrar Dene
            </Button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 m-6 rounded-lg border border-dashed">
            <Filter className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
            <p>İşlem geçmişi bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border-t">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Tarih
                    </div>
                  </TableHead>
                  <TableHead className="font-medium">İşlem Türü</TableHead>
                  <TableHead className="font-medium">Raf No</TableHead>
                  <TableHead className="font-medium">Katman</TableHead>
                  <TableHead className="font-medium">Ürün Adı</TableHead>
                  <TableHead className="font-medium">
                    <div className="flex items-center gap-1">
                      <Edit className="h-3.5 w-3.5" />
                      Değişiklik Detayları
                    </div>
                  </TableHead>
                  <TableHead className="font-medium">Kullanıcı</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="transition-colors duration-200">
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      <div className="flex items-center gap-1">
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${getActionTypeClass(log.actionType)} font-normal flex items-center gap-1`}
                      >
                        {getActionTypeIcon(log.actionType)}
                        {log.actionType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.rafNo !== "sistem" ? (
                        <Badge variant="outline" className="font-normal">
                          {log.rafNo}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.katman !== "oturum" ? log.katman : <span className="text-muted-foreground text-sm">-</span>}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.urunAdi !== "Kullanıcı Girişi" && log.urunAdi !== "Kullanıcı Çıkışı" ? (
                        log.urunAdi
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatChanges(log)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{log.username || "Bilinmeyen Kullanıcı"}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
