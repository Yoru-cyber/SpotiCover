import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { AccentProvider } from "@/components/theme/accent-provider"
import { LangProvider } from "@/components/theme/lang-provider"
import { Header } from "@/components/layout/header"
import "./globals.css"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SpotiCover - Spotify Cover Generator",
  description:
    "Create and download customized Spotify track covers with dynamic blurred backgrounds",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AccentProvider>
            <LangProvider>
              <Header />
              {children}
            </LangProvider>
          </AccentProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}