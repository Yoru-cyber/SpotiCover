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
  onError?: () => void
  theme?: "light" | "dark" | "auto"
}

export function TurnstileWidget({ onVerify, onExpire, onError, theme = "auto" }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const t = useT()

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current) return
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey!,
      callback: onVerify,
      "expired-callback": onExpire,
      "error-callback": () => {
        setErrored(true)
        onError?.()
      },
      theme,
    })
    setLoaded(true)
    setErrored(false)
  }, [siteKey, onVerify, onExpire, onError, theme])

  useEffect(() => {
    if (!siteKey || !containerRef.current) return

    if (document.querySelector("#cf-turnstile-script")) {
      renderWidget()
      return
    }

    const script = document.createElement("script")
    script.id = "cf-turnstile-script"
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"
    script.async = true
    script.defer = true
    script.onload = renderWidget
    document.head.appendChild(script)

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
  }, [siteKey, renderWidget])

  const handleRetry = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
      setErrored(false)
    }
  }, [])

  if (!siteKey) return null

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} />
      {!loaded && !errored && (
        <p className="text-xs text-muted-foreground">{t("turnstile.loading")}</p>
      )}
      {errored && (
        <button type="button" onClick={handleRetry} className="text-xs text-primary underline">
          {t("turnstile.retry")}
        </button>
      )}
    </div>
  )
}