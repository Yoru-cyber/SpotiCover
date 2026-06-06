import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { error } = await searchParams

  return (
    <Suspense>
      <LoginForm error={error} />
    </Suspense>
  )
}
