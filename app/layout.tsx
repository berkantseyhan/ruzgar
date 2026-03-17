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
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{__html: `
          /* Comprehensive CSS Fallback for v0 Preview */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #0f0f0f;
            color: #ffffff;
            line-height: 1.5;
          }
          
          /* Flexbox */
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .flex-row { flex-direction: row; }
          .gap-2 { gap: 0.5rem; }
          .gap-4 { gap: 1rem; }
          .gap-6 { gap: 1.5rem; }
          .gap-8 { gap: 2rem; }
          .items-center { align-items: center; }
          .items-start { align-items: flex-start; }
          .items-end { align-items: flex-end; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .justify-start { justify-content: flex-start; }
          .justify-end { justify-content: flex-end; }
          
          /* Grid */
          .grid { display: grid; }
          .grid-cols-1 { grid-template-columns: 1fr; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          
          /* Padding */
          .p-0 { padding: 0; }
          .p-2 { padding: 0.5rem; }
          .p-4 { padding: 1rem; }
          .p-6 { padding: 1.5rem; }
          .p-8 { padding: 2rem; }
          .px-4 { padding-left: 1rem; padding-right: 1rem; }
          .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
          .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
          
          /* Margin */
          .m-0 { margin: 0; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-6 { margin-bottom: 1.5rem; }
          .mt-2 { margin-top: 0.5rem; }
          .mt-4 { margin-top: 1rem; }
          
          /* Buttons */
          button, [role="button"], .button {
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
            font-size: 1rem;
          }
          
          button:hover { opacity: 0.9; transform: translateY(-2px); }
          .bg-blue-600 { background-color: #2563eb; color: white; }
          .bg-blue-600:hover { background-color: #1d4ed8; }
          .bg-gray-700 { background-color: #374151; color: white; }
          .bg-gray-700:hover { background-color: #2d3748; }
          .text-white { color: #ffffff; }
          
          /* Cards and Containers */
          .rounded-lg { border-radius: 0.5rem; }
          .rounded { border-radius: 0.25rem; }
          .border { border: 1px solid #333333; }
          .bg-card { background-color: #1a1a1a; }
          .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
          .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          
          /* Text Styles */
          .text-xs { font-size: 0.75rem; }
          .text-sm { font-size: 0.875rem; }
          .text-base { font-size: 1rem; }
          .text-lg { font-size: 1.125rem; }
          .text-xl { font-size: 1.25rem; }
          .text-2xl { font-size: 1.5rem; }
          .text-3xl { font-size: 1.875rem; }
          
          .font-medium { font-weight: 500; }
          .font-semibold { font-weight: 600; }
          .font-bold { font-weight: 700; }
          
          /* Display */
          .block { display: block; }
          .inline-block { display: inline-block; }
          .inline-flex { display: inline-flex; }
          .hidden { display: none; }
          
          /* Width/Height */
          .w-full { width: 100%; }
          .h-full { height: 100%; }
          .min-h-screen { min-height: 100vh; }
          
          /* Colors */
          .bg-background { background-color: #0f0f0f; }
          .bg-slate-800 { background-color: #1e293b; }
          .bg-slate-700 { background-color: #334155; }
          .text-foreground { color: #ffffff; }
          .text-gray-400 { color: #9ca3af; }
          
          /* Shelf Grid */
          .grid-auto-fit {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 1rem;
            padding: 1.5rem;
            min-height: 500px;
            border: 1px solid #333333;
            border-radius: 0.5rem;
            background-color: #1a1a1a;
          }
          
          .shelf-item {
            padding: 2rem;
            background-color: #2a3f5f;
            border-radius: 0.5rem;
            text-align: center;
            font-weight: 600;
            font-size: 1.125rem;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
            user-select: none;
          }
          
          .shelf-item:hover {
            background-color: #3a4f6f;
            border-color: #2563eb;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
            transform: translateY(-2px);
          }
          
          /* Headers */
          header {
            background-color: #1a1a1a;
            border-bottom: 1px solid #333333;
            padding: 1rem 1.5rem;
          }
          
          h1, h2, h3, h4, h5, h6 {
            font-weight: 600;
            margin-bottom: 0.5rem;
          }
          
          h1 { font-size: 1.875rem; }
          h2 { font-size: 1.5rem; }
          h3 { font-size: 1.25rem; }
          
          /* Forms */
          input, textarea, select {
            background-color: #2a2a2a;
            color: #ffffff;
            border: 1px solid #444444;
            border-radius: 0.375rem;
            padding: 0.5rem 0.75rem;
            font-size: 1rem;
            transition: all 0.2s ease;
          }
          
          input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          }
          
          /* Container */
          .container {
            margin-left: auto;
            margin-right: auto;
            width: 100%;
            max-width: 1280px;
            padding: 0 1rem;
          }
          
          /* Responsive */
          @media (max-width: 768px) {
            .grid-cols-2 { grid-template-columns: 1fr; }
            .grid-cols-3 { grid-template-columns: repeat(2, 1fr); }
            .grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
            .hidden-mobile { display: none; }
            .grid-auto-fit { grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); }
          }
        `}} />
      </head>
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
