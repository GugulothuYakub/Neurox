import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NeuroX",
  description: "NeuroX is here for you",
    generator: 'MKN.dev'
}

// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} data-gramm="false" data-gramm_editor="false">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <footer className="text-center p-4 text-xs text-gray-500">
          © 2025 NeuroX. All rights reserved by Yakub Gugulothu.
        </footer>
      </body>
    </html>
  )
}