"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus, Trash2, Edit, Save, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { CustomerService } from "@/utils/database-service"

interface CustomerManagementModalProps {
  onClose: () => void
  onCustomerSaved?: () => void
}

interface Customer {
  id: string
  company_name: string
  address: string
  contact_person?: string
  phone?: string
  email?: string
  is_active: boolean
  created_by: string
  created_at: string
}

export function CustomerManagementModal({ onClose, onCustomerSaved }: CustomerManagementModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [formData, setFormData] = useState({
    company_name: "",
    address: "",
  })

  const ITEMS_PER_PAGE = 5

  useEffect(() => {
    loadCustomers(currentPage)
  }, [currentPage])

  const loadCustomers = async (page: number) => {
    setIsLoading(true)
    try {
      const result = await CustomerService.getAllCustomersDetailed(page, ITEMS_PER_PAGE)
      setCustomers(result.customers)
      setTotalPages(result.totalPages)
      setTotalCount(result.totalCount)
      setCurrentPage(result.currentPage)
    } catch (error) {
      console.error("Error loading customers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCustomer = async () => {
    if (!formData.company_name.trim() || !formData.address.trim()) {
      alert("Şirket adı ve adres alanları zorunludur!")
      return
    }

    const currentUser = localStorage.getItem("currentUser") || "Bilinmeyen"

    let success = false
    if (editingId) {
      success = await CustomerService.updateCustomer(editingId, {
        ...formData,
        updated_by: currentUser,
      })
    } else {
      const newCustomer = await CustomerService.saveCustomer({
        ...formData,
        created_by: currentUser,
      })
      success = !!newCustomer
    }

    if (success) {
      await loadCustomers(currentPage)
      resetForm()
      onCustomerSaved?.()
      alert(editingId ? "Müşteri güncellendi!" : "Müşteri eklendi!")
    } else {
      alert("İşlem sırasında hata oluştu!")
    }
  }

  const handleEditCustomer = (customer: Customer) => {
    setFormData({
      company_name: customer.company_name,
      address: customer.address,
    })
    setEditingId(customer.id)
    setShowAddForm(true)
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("Bu müşteriyi silmek istediğinizden emin misiniz?")) {
      return
    }

    const success = await CustomerService.deleteCustomer(customerId)
    if (success) {
      // Eğer mevcut sayfada müşteri kalmadıysa önceki sayfaya git
      if (customers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      } else {
        await loadCustomers(currentPage)
      }
      onCustomerSaved?.()
      alert("Müşteri silindi!")
    } else {
      alert("Müşteri silinirken hata oluştu!")
    }
  }

  const resetForm = () => {
    setFormData({
      company_name: "",
      address: "",
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("tr-TR")
    } catch {
      return dateString
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {startPage > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
            >
              1
            </Button>
            {startPage > 2 && <span className="text-slate-400">...</span>}
          </>
        )}

        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(page)}
            className={
              page === currentPage
                ? "bg-blue-600 text-white"
                : "bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
            }
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-slate-400">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[90vh] bg-slate-800 border-slate-700 flex flex-col">
        <CardHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Müşteri Yönetimi
              <span className="text-sm font-normal text-slate-400">({totalCount} müşteri)</span>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Müşteri
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-grow flex flex-col">
          {showAddForm && (
            <Card className="mb-4 bg-slate-700 border-slate-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">
                  {editingId ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="company_name" className="text-white">
                    Şirket Adı *
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="bg-slate-600 border-slate-500 text-white"
                    placeholder="Şirket adını girin"
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="text-white">
                    Adres *
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-slate-600 border-slate-500 text-white"
                    placeholder="Şirket adresi"
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button onClick={resetForm} variant="outline" className="bg-slate-600 border-slate-500 text-white">
                    İptal
                  </Button>
                  <Button onClick={handleSaveCustomer} className="bg-green-600 hover:bg-green-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? "Güncelle" : "Kaydet"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex-grow">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-white">Yükleniyor...</div>
              </div>
            ) : customers.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-slate-400">Henüz müşteri eklenmemiş</div>
              </div>
            ) : (
              <div className="space-y-3">
                {customers.map((customer) => (
                  <Card key={customer.id} className="bg-slate-700 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-grow">
                          <h3 className="text-white font-semibold text-lg">{customer.company_name}</h3>
                          <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{customer.address}</p>

                          <div className="mt-2 text-xs text-slate-500">
                            Oluşturan: {customer.created_by} • {formatDate(customer.created_at)}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleEditCustomer(customer)}
                            size="sm"
                            variant="outline"
                            className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handleDeleteCustomer(customer.id)} size="sm" variant="destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {renderPagination()}
        </CardContent>
      </Card>
    </div>
  )
}
