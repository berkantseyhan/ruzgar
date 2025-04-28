import { MaterialCalculator } from "@/components/material-calculator"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <main className="min-h-screen bg-background p-4 md:p-8">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Material Calculator</h1>
            <ThemeToggle />
          </div>
          <MaterialCalculator />
        </div>
      </main>
    </ThemeProvider>
  )
}
