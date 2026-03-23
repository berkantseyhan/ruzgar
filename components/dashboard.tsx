"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "@/lib/theme-context"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Moon,
  Sun,
  Loader2,
  History,
  Database,
  LayoutDashboard,
  Map,
  Plus,
  Package,
  Settings,
  BarChart3,
  ChevronRight,
  User,
} from "lucide-react"
import WarehouseMap from "@/components/warehouse-map"
import ProductForm from "@/components/product-form"
import { WarehouseSelector } from "@/components/warehouse-selector"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

type ActiveView = "harita" | "urunEkle" | "raporlar" | "ayarlar"

const NAV_ITEMS = [
  { id: "harita" as ActiveView, label: "Raf Planı", icon: Map },
  { id: "urunEkle" as ActiveView, label: "Ürün Ekle", icon: Plus },
  { id: "raporlar" as ActiveView, label: "Tüm Depo", icon: Database },
  { id: "ayarlar" as ActiveView, label: "Geçmiş", icon: History },
]

export default function Dashboard() {
  const { logout, isLoading, username, loginTime } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const { toast } = useToast()
  const [activeView, setActiveView] = useState<ActiveView>("harita")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleLogout = async () => {
    if (!username) return
    setIsLoggingOut(true)
    try {
      await fetch("/api/auth/logout-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, loginTime }),
      })
    } catch (error) {
      console.error("Error logging user logout:", error)
    }
    logout()
    router.push("/login")
  }

  const handleNavClick = (id: ActiveView) => {
    if (id === "raporlar") {
      router.push("/tum-depo")
      return
    }
    if (id === "ayarlar") {
      router.push("/gecmis")
      return
    }
    setActiveView(id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-sidebar border-r border-border transition-all duration-300 shrink-0",
          sidebarCollapsed ? "w-16" : "w-56",
        )}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
            <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-semibold text-foreground truncate leading-tight">
              Depo Envanter
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeView === id && id !== "raporlar" && id !== "ayarlar"
            return (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                )}
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>{label}</span>}
                {!sidebarCollapsed && isActive && (
                  <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom: user + controls */}
        <div className="border-t border-border px-2 py-3 space-y-1 shrink-0">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
            title={sidebarCollapsed ? "Tema" : undefined}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 shrink-0" />
            ) : (
              <Moon className="h-4 w-4 shrink-0" />
            )}
            {!sidebarCollapsed && <span>Tema</span>}
          </button>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-150"
            title={sidebarCollapsed ? "Çıkış" : undefined}
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <LogOut className="h-4 w-4 shrink-0" />
            )}
            {!sidebarCollapsed && <span>Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Sidebar'ı aç/kapat"
            >
              <LayoutDashboard className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Depo Envanter Yönetimi</h1>
              {username && (
                <div className="flex items-center gap-1 mt-0.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{username}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WarehouseSelector />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Page title row */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {activeView === "harita" ? "Depo Yerleşim Planı" : "Ürün Ekle"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeView === "harita"
                  ? "Raflara tıklayarak içerik görüntüleyin veya seçip PDF alın"
                  : "Depoya yeni ürün ekleyin"}
              </p>
            </div>

            {activeView === "harita" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveView("urunEkle")}
                className="flex items-center gap-2 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Ürün Ekle
              </Button>
            )}
          </div>

          {/* Content card */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {activeView === "harita" && <WarehouseMap />}
            {activeView === "urunEkle" && (
              <div className="p-6">
                <ProductForm onSuccess={() => setActiveView("harita")} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
