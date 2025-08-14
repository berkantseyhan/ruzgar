"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, RefreshCw, Database, Wifi, WifiOff } from "lucide-react"

interface SystemStatus {
  status: string
  message: string
  connection: {
    success: boolean
    message: string
  }
  mode: string
  timestamp: string
}

export default function StatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/test")
      const data = await response.json()

      if (response.ok) {
        setStatus(data)
      } else {
        setError(data.message || "Test failed")
        setStatus(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Sistem Durumu</h1>
        <p className="text-muted-foreground">Depo yönetim sisteminin mevcut durumu ve bağlantı bilgileri</p>
      </div>

      <div className="grid gap-6">
        {/* Ana Durum Kartı */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-2xl">Sistem Durumu</CardTitle>
              <CardDescription>
                Son kontrol: {status?.timestamp ? new Date(status.timestamp).toLocaleString("tr-TR") : "Bilinmiyor"}
              </CardDescription>
            </div>
            <Button onClick={checkStatus} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Yenile
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="text-lg">Kontrol ediliyor...</span>
                </>
              ) : error && !status ? (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-lg text-red-600">Hata: {error}</span>
                </>
              ) : status?.status === "success" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-lg text-green-600">Sistem Çalışıyor</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-lg text-red-600">Sistem Hatası</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Çalışma Modu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Çalışma Modu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">Mock Data Modu</p>
                <p className="text-sm text-muted-foreground">
                  Sistem şu anda bellekte saklanan test verileri ile çalışıyor
                </p>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                <WifiOff className="h-3 w-3 mr-1" />
                OFFLINE
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Bağlantı Durumu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Veritabanı Bağlantısı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Redis</p>
                  <p className="text-sm text-muted-foreground">Upstash Redis bağlantısı</p>
                </div>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <XCircle className="h-3 w-3 mr-1" />
                  Devre Dışı
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Mock Data</p>
                  <p className="text-sm text-muted-foreground">Bellekte saklanan test verileri</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aktif
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistem Mesajları */}
        {status && (
          <Card>
            <CardHeader>
              <CardTitle>Sistem Mesajları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Sistem Mesajı:</p>
                  <p className="text-sm text-blue-700">{status.message}</p>
                </div>

                {status.connection && (
                  <div
                    className={`p-3 border rounded-lg ${
                      status.connection.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${status.connection.success ? "text-green-800" : "text-red-800"}`}
                    >
                      Bağlantı Durumu:
                    </p>
                    <p className={`text-sm ${status.connection.success ? "text-green-700" : "text-red-700"}`}>
                      {status.connection.message}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Uyarı Mesajı */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">⚠️ Önemli Bilgi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              Sistem şu anda <strong>Mock Data Modu</strong>'nda çalışıyor. Tüm veriler bellekte saklanıyor ve sayfa
              yenilendiğinde kaybolacak. Kalıcı veri saklama için Supabase veritabanı kurulumu gerekiyor.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
