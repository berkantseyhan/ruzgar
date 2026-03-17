'use client'

export function CriticalStyles() {
  return (
    <style>{`
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      html, body {
        width: 100%;
        height: 100%;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
      }
      
      body {
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      button, input, select, textarea {
        font-family: inherit;
      }
      
      /* Ensure Tailwind classes work */
      .flex {
        display: flex;
      }
      
      .flex-col {
        flex-direction: column;
      }
      
      .items-center {
        align-items: center;
      }
      
      .justify-center {
        justify-content: center;
      }
      
      .justify-between {
        justify-content: space-between;
      }
      
      .gap-2 {
        gap: 0.5rem;
      }
      
      .gap-3 {
        gap: 0.75rem;
      }
      
      .gap-4 {
        gap: 1rem;
      }
      
      .p-2 {
        padding: 0.5rem;
      }
      
      .p-4 {
        padding: 1rem;
      }
      
      .p-6 {
        padding: 1.5rem;
      }
      
      .bg-background {
        background-color: hsl(210, 40%, 98%);
      }
      
      .dark .bg-background {
        background-color: hsl(222.2, 84%, 4.9%);
      }
      
      .text-foreground {
        color: hsl(222.2, 84%, 4.9%);
      }
      
      .dark .text-foreground {
        color: hsl(210, 40%, 98%);
      }
      
      .text-primary {
        color: hsl(221.2, 83%, 53.3%);
      }
      
      .bg-primary {
        background-color: hsl(221.2, 83%, 53.3%);
      }
      
      .rounded-lg {
        border-radius: 0.5rem;
      }
      
      .border {
        border: 1px solid hsl(214.3, 31.8%, 91.4%);
      }
      
      .shadow-sm {
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      }
      
      .min-h-screen {
        min-height: 100vh;
      }
      
      .w-full {
        width: 100%;
      }
      
      .h-4 {
        height: 1rem;
      }
      
      .w-4 {
        width: 1rem;
      }
      
      .h-8 {
        height: 2rem;
      }
      
      .w-8 {
        width: 2rem;
      }
      
      .text-xl {
        font-size: 1.25rem;
        line-height: 1.75rem;
      }
      
      .font-bold {
        font-weight: 700;
      }
      
      .transition-colors {
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }
      
      .duration-200 {
        transition-duration: 200ms;
      }
      
      .space-y-1 > * + * {
        margin-top: 0.25rem;
      }
      
      .space-y-2 > * + * {
        margin-top: 0.5rem;
      }
      
      .mb-8 {
        margin-bottom: 2rem;
      }
    `}</style>
  )
}
