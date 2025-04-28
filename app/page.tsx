import { MaterialCalculator } from "@/components/material-calculator"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Wind } from "lucide-react"

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <main className="min-h-screen bg-background p-4 md:p-8">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-2">
              <Wind className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Rüzgar Cıvata</h1>
                <p className="text-sm text-muted-foreground">Bağlantı Elemanları Malzeme Hesaplayıcı</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <MaterialCalculator />
        </div>
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>© 2024 Rüzgar Cıvata Bağlantı Elemanları. Tüm hakları saklıdır.</p>
        </footer>
      </main>
    </ThemeProvider>
  )
}
