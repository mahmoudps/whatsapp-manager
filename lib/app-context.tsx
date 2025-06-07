"use client"

<<<<<<< HEAD
import { createContext, useContext, useState, type ReactNode } from "react"

interface Notification {
=======
import type React from "react"
import { createContext, useContext, useReducer, useCallback } from "react"

export interface Notification {
>>>>>>> 83e0b5f7cbb5c54a0d6a252d420d7c6ecc85a6da
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
<<<<<<< HEAD
}

interface AppContextType {
  notifications: Notification[]
  actions: {
    addNotification: (notification: Omit<Notification, "id">) => void
=======
  timestamp: Date
  duration?: number
}

export interface AppState {
  notifications: Notification[]
  isLoading: boolean
  theme: "light" | "dark" | "system"
  sidebarOpen: boolean
  user: any | null
}

type AppAction =
  | { type: "ADD_NOTIFICATION"; payload: Omit<Notification, "id" | "timestamp"> }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_THEME"; payload: "light" | "dark" | "system" }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_USER"; payload: any }
  | { type: "CLEAR_NOTIFICATIONS" }

const initialState: AppState = {
  notifications: [],
  isLoading: false,
  theme: "system",
  sidebarOpen: true,
  user: null,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      const newNotification: Notification = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
      }
      return {
        ...state,
        notifications: [...state.notifications, newNotification],
      }

    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      }

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      }

    case "SET_THEME":
      return {
        ...state,
        theme: action.payload,
      }

    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      }

    case "SET_USER":
      return {
        ...state,
        user: action.payload,
      }

    case "CLEAR_NOTIFICATIONS":
      return {
        ...state,
        notifications: [],
      }

    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  actions: {
    addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void
    removeNotification: (id: string) => void
    setLoading: (loading: boolean) => void
    setTheme: (theme: "light" | "dark" | "system") => void
    toggleSidebar: () => void
    setUser: (user: any) => void
>>>>>>> 83e0b5f7cbb5c54a0d6a252d420d7c6ecc85a6da
    clearNotifications: () => void
  }
}

<<<<<<< HEAD
const AppContext = createContext<AppContextType>({
  notifications: [],
  actions: {
    addNotification: () => {},
    clearNotifications: () => {},
  },
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = Date.now().toString()
    setNotifications((prev) => [...prev, { ...notification, id }])

    // إزالة الإشعار بعد 3 ثوان
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 3000)
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return (
    <AppContext.Provider
      value={{
        notifications,
        actions: {
          addNotification,
          clearNotifications,
        },
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}

export const useAppContext = useApp
=======
const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const actions = {
    addNotification: useCallback((notification: Omit<Notification, "id" | "timestamp">) => {
      dispatch({ type: "ADD_NOTIFICATION", payload: notification })

      // Auto-remove notification after duration
      if (notification.duration !== 0) {
        setTimeout(() => {
          dispatch({ type: "REMOVE_NOTIFICATION", payload: notification.id || "" })
        }, notification.duration || 5000)
      }
    }, []),

    removeNotification: useCallback((id: string) => {
      dispatch({ type: "REMOVE_NOTIFICATION", payload: id })
    }, []),

    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: "SET_LOADING", payload: loading })
    }, []),

    setTheme: useCallback((theme: "light" | "dark" | "system") => {
      dispatch({ type: "SET_THEME", payload: theme })
    }, []),

    toggleSidebar: useCallback(() => {
      dispatch({ type: "TOGGLE_SIDEBAR" })
    }, []),

    setUser: useCallback((user: any) => {
      dispatch({ type: "SET_USER", payload: user })
    }, []),

    clearNotifications: useCallback(() => {
      dispatch({ type: "CLEAR_NOTIFICATIONS" })
    }, []),
  }

  return <AppContext.Provider value={{ state, actions }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
>>>>>>> 83e0b5f7cbb5c54a0d6a252d420d7c6ecc85a6da
