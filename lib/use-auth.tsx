"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

export interface User {
  id: string
  username: string
  email?: string
  role: "admin" | "user"
  createdAt: Date
  lastLogin?: Date
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  token: string | null
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  checkAuth: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    token: null,
  })

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setState({
            user: data.user,
            isLoading: false,
            isAuthenticated: true,
            token: data.token || null,
          })
          return true
        }
      }

      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        token: null,
      })
      return false
    } catch (error) {
      console.error("Auth check failed:", error)
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        token: null,
      })
      return false
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
          token: data.token || null,
        })
        return { success: true }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }))
        return { success: false, error: data.error || "فشل تسجيل الدخول" }
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return { success: false, error: "خطأ في الاتصال بالخادم" }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        token: null,
      })
    }
  }, [])

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setState((prev) => ({
            ...prev,
            token: data.token || null,
          }))
          return true
        }
      }
      return false
    } catch (error) {
      console.error("Token refresh failed:", error)
      return false
    }
  }, [])

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
