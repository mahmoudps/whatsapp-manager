"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
}

interface AppContextType {
  notifications: Notification[]
  actions: {
    addNotification: (notification: Omit<Notification, "id">) => void
    clearNotifications: () => void
  }
}

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
