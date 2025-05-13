"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

export default function StatusPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [details, setDetails] = useState<any>(null)
  const [usingMockData, setUsingMockData] = useState(false)

  const checkStatus = async () => {
    setStatus("loading")
    try {
      const response = await fetch("/api/test")
      const data = await response.json()

      if (data.status === "success") {
        setStatus("success")
        setMessage(data.message)
      } else {
        setStatus("error")
        setMessage(data.message || "Redis bağlantısı başarısız")
      }

      setUsingMockData(data.usingMockData || false)
      setDetails(data)
    } catch (error) {
      setStatus("error")
      setMessage("Redis bağlantısı kontrol edilirken bir hata oluştu")
      setDetails({ error: String(error) })
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "loading" && <RefreshCw className="h-5 w-5 animate-spin" />}
            {status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
            Sistem Durumu
          </CardTitle>
          <CardDescription>Redis bağlantı durumu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Durum:</h3>
              <p className={status === "success" ? "text-green-500" : status === "error" ? "text-destructive" : ""}>
                {status === "loading" ? "Kontrol ediliyor..." : message}
              </p>
            </div>

            {usingMockData && (
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-md">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  Sistem şu anda test verilerini kullanıyor. Redis bağlantısı olmadan da uygulama çalışabilir.
                </p>
              </div>
            )}

            {details && (
              <div>
                <h3 className="font-medium">Detaylar:</h3>
                <pre className="mt-2 rounded-md bg-muted p-4 overflow-auto text-xs">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={checkStatus} disabled={status === "loading"}>
            {status === "loading" ? "Kontrol Ediliyor..." : "Yenile"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
