"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (requiredRole === "admin" && !isAdmin) {
      router.push("/")
      return
    }
  }, [user, isAdmin, requiredRole, router])

  if (!user || (requiredRole === "admin" && !isAdmin)) {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute
