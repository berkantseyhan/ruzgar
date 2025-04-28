"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wind, BarChart, PieChart, Clock, RefreshCw } from "lucide-react"

type AnalyticsData = {
  materials?: Record<string, string>
  shapes?: Record<string, string>
  recent?: Array<{
    materialType: string
    shapeType: string
    weight: string
    cost: string
    timestamp: string
    dimensions?: Record<string, string>
    [key: string]: any
  }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/analytics?type=all")
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || "Veri alınamadı")
      }
    } catch (err) {
      setError("Analitik verileri yüklenirken bir hata oluştu")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(Number.parseInt(timestamp))
    return date.toLocaleString("tr-TR")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-2">
          <Wind className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Rüzgar Cıvata</h1>
            <p className="text-sm text-muted-foreground">Analitik Paneli</p>
          </div>
        </div>
        <Button onClick={fetchAnalytics} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="materials">Malzemeler</TabsTrigger>
          <TabsTrigger value="shapes">Şekiller</TabsTrigger>
          <TabsTrigger value="recent">Son Hesaplamalar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Malzeme Kullanımı
                </CardTitle>
                <CardDescription>En çok kullanılan malzemeler</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex justify-center py-8">Yükleniyor...</div>
                ) : error ? (
                  <div className="text-red-500 py-4">{error}</div>
                ) : !data.materials || Object.keys(data.materials).length === 0 ? (
                  <div className="text-muted-foreground py-4">Henüz veri yok</div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(data.materials).map(([material, count]) => (
                      <div key={material} className="flex justify-between items-center">
                        <span>{material}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Şekil Kullanımı
                </CardTitle>
                <CardDescription>En çok kullanılan kesim şekilleri</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex justify-center py-8">Yükleniyor...</div>
                ) : error ? (
                  <div className="text-red-500 py-4">{error}</div>
                ) : !data.shapes || Object.keys(data.shapes).length === 0 ? (
                  <div className="text-muted-foreground py-4">Henüz veri yok</div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(data.shapes).map(([shape, count]) => (
                      <div key={shape} className="flex justify-between items-center">
                        <span>{shape === "round" ? "Yuvarlak Pul" : "Dikdörtgen Plaka"}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Son Aktivite
                </CardTitle>
                <CardDescription>Son hesaplama işlemleri</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex justify-center py-8">Yükleniyor...</div>
                ) : error ? (
                  <div className="text-red-500 py-4">{error}</div>
                ) : !data.recent || data.recent.length === 0 ? (
                  <div className="text-muted-foreground py-4">Henüz veri yok</div>
                ) : (
                  <div className="space-y-4">
                    {data.recent.slice(0, 3).map((event, index) => (
                      <div key={index} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between">
                          <span className="font-medium">{event.materialType}</span>
                          <span className="text-sm text-muted-foreground">{formatTimestamp(event.timestamp)}</span>
                        </div>
                        <div className="text-sm mt-1">
                          {event.shapeType === "round" ? "Yuvarlak Pul" : "Dikdörtgen Plaka"} -
                          {event.weight && ` ${Number.parseFloat(event.weight).toFixed(3)} kg`} -
                          {event.cost && ` ${Number.parseFloat(event.cost).toFixed(2)} ₺`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle>Malzeme Kullanım İstatistikleri</CardTitle>
              <CardDescription>Hesaplamalarda kullanılan malzemelerin dağılımı</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center py-8">Yükleniyor...</div>
              ) : error ? (
                <div className="text-red-500 py-4">{error}</div>
              ) : !data.materials || Object.keys(data.materials).length === 0 ? (
                <div className="text-muted-foreground py-4">Henüz veri yok</div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(data.materials).map(([material, count]) => (
                    <div key={material} className="flex justify-between items-center p-3 border-b">
                      <span className="font-medium">{material}</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="bg-primary/20 h-4"
                          style={{
                            width: `${Math.min(Number.parseInt(count as string) * 10, 100)}px`,
                            minWidth: "20px",
                          }}
                        />
                        <span>{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shapes">
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle>Şekil Kullanım İstatistikleri</CardTitle>
              <CardDescription>Hesaplamalarda kullanılan kesim şekillerinin dağılımı</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center py-8">Yükleniyor...</div>
              ) : error ? (
                <div className="text-red-500 py-4">{error}</div>
              ) : !data.shapes || Object.keys(data.shapes).length === 0 ? (
                <div className="text-muted-foreground py-4">Henüz veri yok</div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(data.shapes).map(([shape, count]) => (
                    <div key={shape} className="flex justify-between items-center p-3 border-b">
                      <span className="font-medium">
                        {shape === "round" ? "Yuvarlak Pul (Disk)" : "Dikdörtgen Plaka"}
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className="bg-primary/20 h-4"
                          style={{
                            width: `${Math.min(Number.parseInt(count as string) * 10, 100)}px`,
                            minWidth: "20px",
                          }}
                        />
                        <span>{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle>Son Hesaplamalar</CardTitle>
              <CardDescription>Kullanıcılar tarafından yapılan son hesaplamalar</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center py-8">Yükleniyor...</div>
              ) : error ? (
                <div className="text-red-500 py-4">{error}</div>
              ) : !data.recent || data.recent.length === 0 ? (
                <div className="text-muted-foreground py-4">Henüz veri yok</div>
              ) : (
                <div className="space-y-6">
                  {data.recent.map((event, index) => (
                    <div key={index} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-lg">{event.materialType}</span>
                        <span className="text-sm text-muted-foreground">{formatTimestamp(event.timestamp)}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Şekil</p>
                          <p>{event.shapeType === "round" ? "Yuvarlak Pul (Disk)" : "Dikdörtgen Plaka"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Yoğunluk</p>
                          <p>{event.materialDensity} g/cm³</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Ağırlık</p>
                          <p>{Number.parseFloat(event.weight).toFixed(3)} kg</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Maliyet</p>
                          <p>{Number.parseFloat(event.cost).toFixed(2)} ₺</p>
                        </div>
                        {event.quantity && Number.parseInt(event.quantity) > 1 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Adet</p>
                            <p>{event.quantity}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
