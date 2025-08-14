"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Database, Server, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface SystemStatus {
  timestamp: string
  status: "healthy" | "degraded" | "error"
  mode: "supabase" | "mock" | "error"
  database: {
    connected: boolean
    message: string
    tables: string[]
  }
  environment: {
    nodeEnv: string
    hasSupabaseUrl: boolean
    hasSupabaseKey: boolean
  }
}

export default function StatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/test", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      const data = await response.json()
      setStatus(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to fetch status:", error)
      setStatus({
        timestamp: new Date().toISOString(),
        status: "error",
        mode: "error",
        database: {
          connected: false,
          message: "Failed to fetch system status",
          tables: [],
        },
        environment: {
          nodeEnv: "unknown",
          hasSupabaseUrl: false,
          hasSupabaseKey: false,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800"
      case "degraded":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "supabase":
        return "bg-blue-100 text-blue-800"
      case "mock":
        return "bg-purple-100 text-purple-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sistem Durumu</h1>
            <p className="text-gray-600 mt-1">Depo Rüzgar Uygulaması - Sistem Sağlık Kontrolü</p>
          </div>
          <Button
            onClick={fetchStatus}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </Button>
        </div>

        {status && (
          <>
            {/* Overall Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(status.status)}
                  Genel Durum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(status.status)}>{status.status.toUpperCase()}</Badge>
                  <Badge className={getModeColor(status.mode)}>
                    {status.mode === "supabase" && "Supabase Modu"}
                    {status.mode === "mock" && "Mock Data Modu"}
                    {status.mode === "error" && "Hata Modu"}
                  </Badge>
                  {lastUpdated && (
                    <span className="text-sm text-gray-500">
                      Son güncelleme: {lastUpdated.toLocaleTimeString("tr-TR")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Database Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Veritabanı Durumu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {status.database.connected ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">{status.database.connected ? "Bağlı" : "Bağlantı Yok"}</span>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{status.database.message}</p>
                </div>

                {status.database.tables.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Mevcut Tablolar:</h4>
                    <div className="flex flex-wrap gap-2">
                      {status.database.tables.map((table) => (
                        <Badge key={table} variant="outline">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Environment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Ortam Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Node.js Ortamı:</span>
                    <Badge variant="outline">{status.environment.nodeEnv}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Supabase URL:</span>
                    {status.environment.hasSupabaseUrl ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Supabase Key:</span>
                    {status.environment.hasSupabaseKey ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mode Explanation */}
            <Card>
              <CardHeader>
                <CardTitle>Mod Açıklaması</CardTitle>
              </CardHeader>
              <CardContent>
                {status.mode === "supabase" && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Supabase Modu</h4>
                    <p className="text-blue-800 text-sm">
                      Sistem Supabase veritabanına bağlı ve tüm veriler gerçek veritabanından geliyor. Tüm değişiklikler
                      kalıcı olarak saklanıyor.
                    </p>
                  </div>
                )}

                {status.mode === "mock" && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Mock Data Modu</h4>
                    <p className="text-purple-800 text-sm">
                      Sistem mock (sahte) verilerle çalışıyor. Supabase tabloları bulunamadı veya bağlantı kurulamadı.
                      Değişiklikler geçici olarak bellekte tutuluyor ve sayfa yenilendiğinde kaybolacak.
                    </p>
                  </div>
                )}

                {status.mode === "error" && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">Hata Modu</h4>
                    <p className="text-red-800 text-sm">
                      Sistemde bir hata oluştu. Lütfen sistem yöneticisi ile iletişime geçin.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Setup Instructions */}
            {status.mode === "mock" && (
              <Card>
                <CardHeader>
                  <CardTitle>Supabase Kurulum Talimatları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Gerçek Veritabanına Geçmek İçin:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-yellow-800 text-sm">
                      <li>Supabase Dashboard'a gidin</li>
                      <li>SQL Editor'ı açın</li>
                      <li>
                        <code className="bg-yellow-200 px-1 rounded">001_create_depo_ruzgar_tables.sql</code> dosyasını
                        çalıştırın
                      </li>
                      <li>
                        <code className="bg-yellow-200 px-1 rounded">002_seed_depo_ruzgar_data.sql</code> dosyasını
                        çalıştırın
                      </li>
                      <li>Bu sayfayı yenileyin</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {loading && !status && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Sistem durumu kontrol ediliyor...</span>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
