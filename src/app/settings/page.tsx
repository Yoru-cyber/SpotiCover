"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useThemeStore, type AccentColor } from "@/stores/theme-store"
import { cn } from "@/lib/utils"
import { Check, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { useT } from "@/lib/i18n/use-t"
import { Button } from "@/components/ui/button"

const accentColors: { key: AccentColor; labelKey: "settings.accent.green" | "settings.accent.blue" | "settings.accent.purple" | "settings.accent.orange" | "settings.accent.pink"; descKey: "settings.accent.green.desc" | "settings.accent.blue.desc" | "settings.accent.purple.desc" | "settings.accent.orange.desc" | "settings.accent.pink.desc"; bg: string }[] = [
  { key: "green", labelKey: "settings.accent.green", descKey: "settings.accent.green.desc", bg: "bg-emerald-500" },
  { key: "blue", labelKey: "settings.accent.blue", descKey: "settings.accent.blue.desc", bg: "bg-sky-500" },
  { key: "purple", labelKey: "settings.accent.purple", descKey: "settings.accent.purple.desc", bg: "bg-violet-500" },
  { key: "orange", labelKey: "settings.accent.orange", descKey: "settings.accent.orange.desc", bg: "bg-amber-500" },
  { key: "pink", labelKey: "settings.accent.pink", descKey: "settings.accent.pink.desc", bg: "bg-pink-500" },
]

export default function SettingsPage() {
  const { accent, setAccent } = useThemeStore()
  const t = useT()
  const router = useRouter()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDeleteAccount = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }

    setDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch("/api/auth/account", { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Unknown error")
      }
      router.push("/auth/login")
    } catch {
      setDeleteError(t("settings.deleteAccount.error"))
      setConfirmingDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("settings.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("settings.subtitle")}
          </p>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              {t("settings.accent")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("settings.accent.description")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {accentColors.map((c) => {
              const isSelected = accent === c.key

              return (
                <button
                  key={c.key}
                  onClick={() => setAccent(c.key)}
                  className={cn(
                    "relative flex items-start gap-3 rounded-lg border p-3 text-left transition-all hover:bg-muted/50",
                    isSelected
                      ? "border-ring ring-1 ring-ring"
                      : "border-border"
                  )}
                >
                  <span className={cn("mt-0.5 size-5 shrink-0 rounded-full", c.bg)} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{t(c.labelKey)}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {t(c.descKey)}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                  )}
                </button>
              )
            })}
          </div>
        </section>

        <hr className="border-border" />

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="size-4" />
              {t("settings.deleteAccount")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("settings.deleteAccount.description")}
            </p>
          </div>

          {deleteError && (
            <p className="text-xs text-destructive">{deleteError}</p>
          )}

          {confirmingDelete && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-destructive"
            >
              {t("settings.deleteAccount.confirm")}
            </motion.p>
          )}

          <Button
            onClick={handleDeleteAccount}
            variant="destructive"
            disabled={deleting}
            className="gap-2"
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {t("settings.deleteAccount.button")}
          </Button>
        </section>
      </motion.div>
    </main>
  )
}