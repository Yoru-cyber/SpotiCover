"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { AccentPicker } from "@/components/theme/accent-picker"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"

export function Header() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
        <span className="text-sm font-semibold tracking-tight">
          SpotiCover
        </span>
        <div className="flex items-center gap-2">
          <AccentPicker />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
