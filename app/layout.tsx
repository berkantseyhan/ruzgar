import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import { ThemeProvider } from "@/lib/theme-context"
import { AuthProvider } from "@/lib/auth-context"
import { WarehouseProvider } from "@/lib/warehouse-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

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
    <html lang="tr" className="dark" suppressHydrationWarning>
      <head>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
        >{`
          (function() {
            try {
              var theme = localStorage.getItem('theme');
              if (theme === 'light') {
                document.documentElement.classList.remove('dark');
              } else {
                document.documentElement.classList.add('dark');
              }
            } catch (e) {
              document.documentElement.classList.add('dark');
            }
          })();
        `}</Script>
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
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
