'use client'

export function CSSInjector() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      html {
        scroll-behavior: smooth;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
        background-color: hsl(210, 40%, 98%);
        color: hsl(222.2, 84%, 4.9%);
        line-height: 1.5;
      }
      
      html.dark body {
        background-color: hsl(222.2, 84%, 4.9%);
        color: hsl(210, 40%, 98%);
      }
    `}} />
  )
}
