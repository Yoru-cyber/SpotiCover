"use client"

import { motion } from "framer-motion"
import { useThemeStore, type AccentColor, type Language } from "@/stores/theme-store"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

const accentColors: { key: AccentColor; labelEs: string; labelEn: string; bg: string; descriptionEs: string; descriptionEn: string }[] = [
  {
    key: "green",
    labelEs: "Verde",
    labelEn: "Green",
    bg: "bg-emerald-500",
    descriptionEs: "Color por defecto. Inspirado en el verde característico de Spotify.",
    descriptionEn: "Default color. Inspired by Spotify's signature green.",
  },
  {
    key: "blue",
    labelEs: "Azul",
    labelEn: "Blue",
    bg: "bg-sky-500",
    descriptionEs: "Un azul vibrante que aporta frescura y claridad a la interfaz.",
    descriptionEn: "A vibrant blue that brings freshness and clarity to the interface.",
  },
  {
    key: "purple",
    labelEs: "Púrpura",
    labelEn: "Purple",
    bg: "bg-violet-500",
    descriptionEs: "Tono púrpura elegante para una experiencia más sofisticada.",
    descriptionEn: "Elegant purple tone for a more sophisticated experience.",
  },
  {
    key: "orange",
    labelEs: "Naranja",
    labelEn: "Orange",
    bg: "bg-amber-500",
    descriptionEs: "Naranja cálido que energiza el diseño de la aplicación.",
    descriptionEn: "Warm orange that energizes the application design.",
  },
  {
    key: "pink",
    labelEs: "Rosa",
    labelEn: "Pink",
    bg: "bg-pink-500",
    descriptionEs: "Rosa suave y moderno para un estilo más llamativo.",
    descriptionEn: "Soft and modern pink for a bolder style.",
  },
]

const languages: { key: Language; label: string; flag: string; descriptionEs: string; descriptionEn: string }[] = [
  {
    key: "es",
    label: "Español",
    flag: "🇪🇸",
    descriptionEs: "Idioma por defecto. Toda la interfaz se muestra en español.",
    descriptionEn: "Default language. The entire interface is displayed in Spanish.",
  },
  {
    key: "en",
    label: "English",
    flag: "🇬🇧",
    descriptionEs: "Cambia la interfaz a inglés para una experiencia internacional.",
    descriptionEn: "Switch the interface to English for an international experience.",
  },
]

export default function SettingsPage() {
  const { accent, setAccent, language, setLanguage } = useThemeStore()

  const t = (es: string, en: string) => (language === "es" ? es : en)

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("Configuración", "Settings")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              "Personaliza la apariencia y el idioma de la aplicación.",
              "Customize the appearance and language of the application."
            )}
          </p>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              {t("Color de acento", "Accent color")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(
                "Define el color principal de la interfaz. Los botones, enlaces y elementos interactivos usarán este color.",
                "Set the main color of the interface. Buttons, links, and interactive elements will use this color."
              )}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {accentColors.map((c) => {
              const isSelected = accent === c.key
              const label = language === "es" ? c.labelEs : c.labelEn
              const description = language === "es" ? c.descriptionEs : c.descriptionEn

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
                    <span className="text-sm font-medium">{label}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {description}
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

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              {t("Idioma", "Language")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(
                "Selecciona el idioma de la interfaz. Actualmente solo afecta la visualización de textos; el resto de la aplicación permanece sin cambios.",
                "Select the interface language. Currently it only affects text display; the rest of the application remains unchanged."
              )}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {languages.map((l) => {
              const isSelected = language === l.key
              const description = language === "es" ? l.descriptionEs : l.descriptionEn

              return (
                <button
                  key={l.key}
                  onClick={() => setLanguage(l.key)}
                  className={cn(
                    "relative flex items-start gap-3 rounded-lg border p-3 text-left transition-all hover:bg-muted/50",
                    isSelected
                      ? "border-ring ring-1 ring-ring"
                      : "border-border"
                  )}
                >
                  <span className="text-lg mt-0.5">{l.flag}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{l.label}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {description}
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
      </motion.div>
    </main>
  )
}