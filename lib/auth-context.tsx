"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface AuthContextType {
  isAuthenticated: boolean
  username: string | null
  login: (password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  setUsername: (name: string) => void
  needsUsername: boolean
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  username: null,
  login: async () => false,
  logout: () => {},
  isLoading: true,
  setUsername: () => {},
  needsUsername: false,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsernameState] = useState<string | null>(null)
  const [needsUsername, setNeedsUsername] = useState(false)

  useEffect(() => {
    // Check if user is already authenticated
    const auth = localStorage.getItem("auth")
    const storedUsername = localStorage.getItem("username")

    if (auth === "true") {
      setIsAuthenticated(true)

      // If authenticated but no username, we need to prompt for it
      if (!storedUsername) {
        setNeedsUsername(true)
      } else {
        setUsernameState(storedUsername)
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (password: string) => {
    try {
      // Verify password against stored password
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()

      if (data.success) {
        setIsAuthenticated(true)
        localStorage.setItem("auth", "true")

        // Check if username exists
        const storedUsername = localStorage.getItem("username")
        if (!storedUsername) {
          setNeedsUsername(true)
        } else {
          setUsernameState(storedUsername)
        }

        return true
      }

      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("auth")
    // We don't remove username on logout to remember the user
  }

  const setUsername = (name: string) => {
    setUsernameState(name)
    setNeedsUsername(false)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        username,
        login,
        logout,
        isLoading,
        setUsername,
        needsUsername,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
