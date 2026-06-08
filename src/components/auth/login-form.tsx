"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Mail, ArrowRight, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { TurnstileWidget } from "./turnstile-widget"
import { useT } from "@/lib/i18n/use-t"

export function LoginForm({ error: paramError }: { error?: string }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileError, setTurnstileError] = useState(false)
  const [message, setMessage] = useState<{
    type: "error" | "success"
    text: string
  } | null>(null)
  const router = useRouter()
  const t = useT()

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token)
    setTurnstileError(false)
  }, [])

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null)
  }, [])

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken(null)
    setTurnstileError(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!turnstileToken) {
      setMessage({ type: "error", text: t("login.error.turnstile") })
      setLoading(false)
      return
    }

    const verifyRes = await fetch("/api/auth/verify-turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: turnstileToken }),
    })
    const verifyData = await verifyRes.json()

    if (!verifyData.success) {
      setMessage({ type: "error", text: t("login.error.turnstile.failed") })
      setTurnstileToken(null)
      setLoading(false)
      return
    }

    const { data, error: authError } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    if (authError) {
      const messageText =
        authError.message === "User already registered"
          ? t("login.error.registered")
          : authError.message
      setMessage({ type: "error", text: messageText })
      setLoading(false)
      return
    }

    if (mode === "signup") {
      setMessage({
        type: "success",
        text: t("login.success.signup"),
      })
      setLoading(false)
      return
    }

    if (data.session) {
      await supabase.auth.setSession(data.session)
    }

    router.push("/")
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">SpotiCover</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? t("login.title.login") : t("login.title.signup")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.email")}
                required
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
              />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("login.password")}
              required
              minLength={6}
              className="w-full h-10 px-4 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
            />
          </div>

          <TurnstileWidget onVerify={handleTurnstileVerify} onExpire={handleTurnstileExpire} onError={handleTurnstileError} />

          {paramError && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="size-3.5" />
              {t("login.error.auth")}
            </div>
          )}

          {message && (
            <div
              className={`flex items-center gap-2 text-xs ${message.type === "error" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}
            >
              <AlertCircle className="size-3.5" />
              {message.text}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || !turnstileToken}>
            {loading ? (
              t("login.loading")
            ) : (
              <>
                {mode === "login" ? t("login.submit.login") : t("login.submit.signup")}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {mode === "login" ? (
            <>
              {t("login.toggle.signup")}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup")
                  setMessage(null)
                }}
                className="text-primary hover:underline"
              >
                {t("login.toggle.signup.link")}
              </button>
            </>
          ) : (
            <>
              {t("login.toggle.login")}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login")
                  setMessage(null)
                }}
                className="text-primary hover:underline"
              >
                {t("login.toggle.login.link")}
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  )
}