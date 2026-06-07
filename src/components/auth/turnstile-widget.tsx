"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useT } from "@/lib/i18n/use-t"

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string
        callback: (token: string) => void
        "expired-callback"?: () => void
        "error-callback"?: () => void
        theme?: "light" | "dark" | "auto"
      }) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  theme?: "light" | "dark" | "auto"
}

export function TurnstileWidget({ onVerify, onExpire, theme = "auto" }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const t = useT()

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey || !containerRef.current) return

    if (document.querySelector("#cf-turnstile-script")) {
      if (window.turnstile && containerRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          "expired-callback": onExpire,
          "error-callback": onExpire,
          theme,
        })
        setLoaded(true)
      }
      return
    }

    const script = document.createElement("script")
    script.id = "cf-turnstile-script"
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.turnstile && containerRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          "expired-callback": onExpire,
          "error-callback": onExpire,
          theme,
        })
        setLoaded(true)
      }
    }
    document.head.appendChild(script)

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
  }, [siteKey, onVerify, onExpire, theme])

  const handleRetry = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
  }, [])

  if (!siteKey) return null

  return (
    <div className="flex justify-center">
      <div ref={containerRef} />
      {!loaded && (
        <button type="button" onClick={handleRetry} className="text-xs text-muted-foreground underline">
          {t("turnstile.loading")}
        </button>
      )}
    </div>
  )
}