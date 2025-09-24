"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { AuthUser } from "@/types"
import { checkAuth } from "@/services/auth"
import api from "@/services/auth"

interface AuthContextType {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  isAdmin: boolean
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isAdmin: false,
  refreshUserData: async () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Function to refresh user data from the server
  const refreshUserData = async () => {
    try {
      // Only run on client side
      if (typeof window === "undefined") return

      const token = localStorage.getItem("auth_token")
      if (!token) return

      // Fetch the latest user data from the server
      const response = await api.get("/api/user/profile")

      if (response.data && response.data.user) {
        // Update user in state and localStorage
        setUser(response.data.user)
        localStorage.setItem("user", JSON.stringify(response.data.user))
        console.log("User data refreshed successfully", response.data.user)
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
    }
  }

  const initializeAuth = async () => {
    try {
      const isAuthenticated = await checkAuth()

      if (isAuthenticated) {
        // We're in the browser
        if (typeof window !== "undefined") {
          const storedUser = localStorage.getItem("user")
          if (storedUser) {
            setUser(JSON.parse(storedUser))

            // Refresh user data in the background to ensure it's up to date
            refreshUserData().catch((err) => console.error("Background refresh failed:", err))
          }
        }
      } else {
        // Don't redirect to login by default - let users browse the site
        // Only protected routes will check auth status and redirect if needed
      }
    } catch (error) {
      console.error("Auth initialization error:", error)
    } finally {
      setIsInitialized(true)
    }
  }

  useEffect(() => {
    initializeAuth()

    // Check auth status and refresh user data periodically
    const authInterval = setInterval(initializeAuth, 15 * 60 * 1000) // Every 15 minutes

    // More frequent user data refresh to catch membership changes
    const refreshInterval = setInterval(refreshUserData, 5 * 60 * 1000) // Every 5 minutes

    return () => {
      clearInterval(authInterval)
      clearInterval(refreshInterval)
    }
  }, [])

  const isAdmin = user?.membership_status === "admin"

  if (!isInitialized) {
    return null
  }

  return <AuthContext.Provider value={{ user, setUser, isAdmin, refreshUserData }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
