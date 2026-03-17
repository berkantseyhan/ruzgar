import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { ThemeProvider } from "@/lib/theme-context"
import { AuthProvider } from "@/lib/auth-context"
import { WarehouseProvider } from "@/lib/warehouse-context"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Depo Envanter Yönetim Sistemi",
  description: "Modern depo envanter yönetim uygulaması",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <WarehouseProvider>
              {children}
              <Toaster />
            </WarehouseProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
