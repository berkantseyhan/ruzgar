"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RefreshCw, Search, Download, ArrowUpDown, Loader2, Filter, Database, Package } from "lucide-react"
import type { Product } from "@/lib/redis"
import { useToast } from "@/components/ui/use-toast"
import { convertHeadersForCSV } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type SortField = "rafNo" | "katman" | "urunAdi" | "kategori" | "olcu" | "kilogram"
type SortDirection = "asc" | "desc"

export default function AllProductsComponent() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("rafNo")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const { toast } = useToast()

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/products")
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }
      const data = await response.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error("Error fetching products:", err)
      setError(err instanceof Error ? err.message : "Ürünler yüklenirken bir hata oluştu")
      toast({
        title: "Hata",
        description: "Ürünler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredAndSortedProducts = useMemo(() => {
    // First filter
    const filtered = products.filter(
      (product) =>
        product.urunAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.olcu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.rafNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.katman.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.notlar.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Then sort
    return [...filtered].sort((a, b) => {
      let valueA: string | number = a[sortField]
      let valueB: string | number = b[sortField]

      // Handle numeric fields
      if (sortField === "kilogram") {
        valueA = Number(valueA)
        valueB = Number(valueB)
      } else {
        valueA = String(valueA).toLowerCase()
        valueB = String(valueB).toLowerCase()
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [products, searchTerm, sortField, sortDirection])

  const handleExportCSV = () => {
    try {
      // Define headers with Turkish characters
      const turkishHeaders = ["Raf No", "Katman", "Ürün Adı", "Kategori", "Ölçü", "Kilogram", "Notlar"]

      // Convert headers to Latin equivalents
      const latinHeaders = convertHeadersForCSV(turkishHeaders)

      // Create CSV rows with semicolon separator
      const csvRows = [
        latinHeaders.join(";"),
        ...filteredAndSortedProducts.map((product) =>
          [
            product.rafNo,
            product.katman,
            product.urunAdi.replace(/;/g, ","),
            product.kategori.replace(/;/g, ","),
            product.olcu.replace(/;/g, ","),
            String(product.kilogram).replace(".", ","), // Use comma as decimal separator for Excel
            product.notlar.replace(/;/g, ","),
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
      link.setAttribute("download", `depo-envanter-${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Başarılı",
        description: "Envanter verisi CSV olarak indirildi.",
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

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort(field)}>
      <div className="flex items-center">
        {children}
        <ArrowUpDown
          className={`ml-1 h-4 w-4 ${sortField === field ? "opacity-100" : "opacity-40"} ${
            sortField === field && sortDirection === "desc" ? "rotate-180" : ""
          } transition-transform`}
        />
      </div>
    </TableHead>
  )

  const getShelfBadgeColor = (shelfId: string) => {
    switch (shelfId) {
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

  return (
    <Card className="w-full shadow-md border">
      <CardHeader className="bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-md">
                <Database className="h-5 w-5 text-primary" />
              </div>
              Tüm Depo Envanteri
            </CardTitle>
            <CardDescription>Tüm raflardaki ürünlerin listesi</CardDescription>
          </div>
          <Badge variant="outline" className="font-normal">
            {filteredAndSortedProducts.length} ürün
          </Badge>
        </div>
        <div className="flex items-center justify-between mt-4 gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Ara..."
              className="pl-8 shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchProducts}
              disabled={loading}
              className="shadow-sm hover:shadow-md transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="sr-only">Yenile</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleExportCSV}
              disabled={filteredAndSortedProducts.length === 0}
              className="shadow-sm hover:shadow-md transition-all"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">CSV İndir</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading && products.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-40 gap-3 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Ürünler yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive bg-destructive/10 m-6 rounded-lg border border-destructive/20">
            <p className="font-medium">{error}</p>
            <Button onClick={fetchProducts} className="mt-4" variant="outline">
              Tekrar Dene
            </Button>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 m-6 rounded-lg border border-dashed">
            <Filter className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
            <p>Ürün bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border-t">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <SortableHeader field="rafNo">Raf No</SortableHeader>
                  <SortableHeader field="katman">Katman</SortableHeader>
                  <SortableHeader field="urunAdi">Ürün Adı</SortableHeader>
                  <SortableHeader field="kategori">Kategori</SortableHeader>
                  <SortableHeader field="olcu">Ölçü</SortableHeader>
                  <SortableHeader field="kilogram">Kilogram</SortableHeader>
                  <TableHead>Notlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <Badge className={`${getShelfBadgeColor(product.rafNo)} font-normal`}>{product.rafNo}</Badge>
                    </TableCell>
                    <TableCell>{product.katman}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-primary" />
                        <span>{product.urunAdi}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {product.kategori}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.olcu}</TableCell>
                    <TableCell className="font-mono">{product.kilogram}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {product.notlar ? (
                        <span className="inline-block max-w-xs truncate" title={product.notlar}>
                          {product.notlar}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
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
