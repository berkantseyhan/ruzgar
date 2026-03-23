"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "@/lib/theme-context"
import { Button } from "@/components/ui/button"
import { LogOut, Moon, Sun, Loader2, History, Database, User, LayoutDashboard, Map, Plus } from "lucide-react"
import WarehouseMap from "@/components/warehouse-map"
import ProductForm from "@/components/product-form"
import { WarehouseSelector } from "@/components/warehouse-selector"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const { logout, isLoading, username, loginTime } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("harita")
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (!username) return

    setIsLoggingOut(true)

    try {
      // Log the user logout
      await fetch("/api/auth/logout-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          loginTime,
        }),
      })
    } catch (error) {
      console.error("Error logging user logout:", error)
      // Continue with logout even if logging fails
    }

    logout()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b p-4 shadow-sm bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Depo Envanter Yönetimi</h1>
              {username && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{username}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WarehouseSelector />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full transition-colors duration-200"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="sr-only">Tema Değiştir</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/gecmis")}
                className="rounded-full transition-colors duration-200"
              >
                <History className="h-4 w-4" />
                <span className="sr-only">İşlem Geçmişi</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-full transition-colors duration-200"
              >
                {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                <span className="sr-only">Çıkış Yap</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6 animate-fadeIn">
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Depo Yönetimi</h2>
            <p className="text-sm text-muted-foreground">Ürün eklemek ve görüntülemek için depo haritasını kullanın</p>
          </div>
          <Button
            onClick={() => router.push("/tum-depo")}
            className="flex items-center gap-2 bg-primary transition-colors duration-200 shadow-md"
          >
            <Database className="h-4 w-4" />
            Tüm Depoyu Göster
          </Button>
        </div>

        <Tabs value={activeTab} className="w-full">
          {/* Modern tab design */}
          <div className="max-w-md mx-auto mb-8 p-1.5 bg-gray-800 dark:bg-gray-900 rounded-xl shadow-md flex space-x-2">
            <button
              onClick={() => setActiveTab("harita")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200",
                activeTab === "harita"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600",
              )}
            >
              <Map className="h-4 w-4" />
              <span>Depo Haritası</span>
            </button>
            <button
              onClick={() => setActiveTab("urunEkle")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200",
                activeTab === "urunEkle"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600",
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Ürün Ekle</span>
            </button>
          </div>

          <div className="bg-card rounded-lg border shadow-sm p-6">
            <TabsContent value="harita" className="mt-0 animate-fadeIn">
              <WarehouseMap />
            </TabsContent>

            <TabsContent value="urunEkle" className="mt-0 animate-fadeIn">
              <ProductForm onSuccess={() => setActiveTab("harita")} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}
