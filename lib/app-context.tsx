"use client"

import { createContext, useContext, useReducer, type ReactNode } from "react"

// تعريف الأنواع
interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  timestamp: number
}

interface AppState {
  notifications: Notification[]
  isLoading: boolean
  user: any | null
}

type AppAction =
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: any | null }
  | { type: "CLEAR_NOTIFICATIONS" }

interface AppContextType {
  state: AppState
  actions: {
    addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void
    removeNotification: (id: string) => void
    setLoading: (loading: boolean) => void
    setUser: (user: any | null) => void
    clearNotifications: () => void
  }
}

// الحالة الأولية
const initialState: AppState = {
  notifications: [],
  isLoading: false,
  user: null,
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
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

// Context
const AppContext = createContext<AppContextType | undefined>(undefined)

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const actions = {
    addNotification: (notification: Omit<Notification, "id" | "timestamp">) => {
      const notificationId = Math.random().toString(36).substr(2, 9)
      const newNotification: Notification = {
        ...notification,
        id: notificationId,
        timestamp: Date.now(),
      }
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: newNotification,
      })

      // إزالة الإشعار تلقائياً بعد 5 ثوان
      setTimeout(() => {
        dispatch({
          type: "REMOVE_NOTIFICATION",
          payload: notificationId,
        })
      }, 5000)
    },
    removeNotification: (id: string) => {
      dispatch({ type: "REMOVE_NOTIFICATION", payload: id })
    },
    setLoading: (loading: boolean) => {
      dispatch({ type: "SET_LOADING", payload: loading })
    },
    setUser: (user: any | null) => {
      dispatch({ type: "SET_USER", payload: user })
    },
    clearNotifications: () => {
      dispatch({ type: "CLEAR_NOTIFICATIONS" })
    },
  }

  return <AppContext.Provider value={{ state, actions }}>{children}</AppContext.Provider>
}

// Hook
export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
