"use client"

import { useRouter } from "next/navigation"
import { SetStateAction, useEffect, useState } from "react"
import { LogOut, Settings, User } from "lucide-react"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"

export function Header() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: { user: { email: SetStateAction<string | null> } }) => {
      if (session?.user?.email) {
        setEmail(session.user.email)
      } else {
        setEmail(null)
      }
      setLoading(false)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setEmail(null)
    router.push("/auth/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 items-center justify-between px-4 max-w-5xl">
        <Link href="/" className="text-base font-bold tracking-tight text-foreground select-none">
          SpotiCover
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!loading && email && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    className="flex items-center justify-center rounded-full border border-input bg-background hover:bg-accent hover:text-accent-foreground size-8 cursor-pointer transition-colors"
                    aria-label="Menú de usuario"
                  >
                    <User className="size-4" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-fit">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-medium leading-none text-muted-foreground">Cuenta</p>
                      <p className="text-sm font-medium leading-none">{email}</p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
                    <Settings className="mr-2 size-4" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 size-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}