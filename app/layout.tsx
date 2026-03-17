import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/lib/theme-context"
import { AuthProvider } from "@/lib/auth-context"
import { WarehouseProvider } from "@/lib/warehouse-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "Depo Envanter Yönetim Sistemi",
  description: "Modern depo envanter yönetim uygulaması",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning className={inter.variable}>
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
