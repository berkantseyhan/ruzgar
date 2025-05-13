"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Dashboard from "@/components/dashboard"
import UsernameModal from "@/components/username-modal"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { isAuthenticated, isLoading, needsUsername, setUsername } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  const handleUsernameComplete = (username: string) => {
    setUsername(username)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      {needsUsername && <UsernameModal onComplete={handleUsernameComplete} />}
      <Dashboard />
    </>
  )
}
