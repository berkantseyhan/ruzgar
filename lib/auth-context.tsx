"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface AuthContextType {
  isAuthenticated: boolean
  username: string | null
  isLoading: boolean
  login: (password: string) => Promise<boolean>
  setUsername: (username: string) => void
  logout: () => void
  loginTime: number | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsernameState] = useState<string | null>(null)
  const [loginTime, setLoginTime] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem("isAuthenticated")
    const storedUsername = localStorage.getItem("username")
    const storedLoginTime = localStorage.getItem("loginTime")

    if (authStatus === "true" && storedUsername) {
      setIsAuthenticated(true)
      setUsernameState(storedUsername)
      setLoginTime(storedLoginTime ? Number.parseInt(storedLoginTime) : null)
    }

    setIsLoading(false)
  }, [])

  const login = async (password: string): Promise<boolean> => {
    try {
      console.log("Attempting login...")

      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", jsonError)
        console.error("Response status:", response.status)
        console.error("Response text:", await response.text())
        return false
      }

      console.log("Login response:", data)

      if (data.success) {
        // Password is correct, but don't set as authenticated yet
        // Wait for username to be set
        console.log("Password verified, waiting for username")
        return true
      } else {
        console.log("Login failed:", data.message)
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const setUsername = (newUsername: string) => {
    const currentTime = Date.now()

    setIsAuthenticated(true)
    setUsernameState(newUsername)
    setLoginTime(currentTime)

    // Store in localStorage
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("username", newUsername)
    localStorage.setItem("loginTime", currentTime.toString())

    console.log("Username set and user authenticated:", newUsername)
  }

  const logout = () => {
    console.log("Logging out...")
    setIsAuthenticated(false)
    setUsernameState(null)
    setLoginTime(null)

    // Clear localStorage
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("username")
    localStorage.removeItem("loginTime")

    console.log("Logout successful")
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        username,
        isLoading,
        login,
        setUsername,
        logout,
        loginTime,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
