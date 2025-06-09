"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

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
    removeNotification: (id: string) => void
    clearNotifications: () => void
  }
}

const AppContext = createContext<AppContextType>({
  notifications: [],
  actions: {
    addNotification: () => {},
    removeNotification: () => {},
    clearNotifications: () => {},
  },
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = Date.now().toString()
    setNotifications((prev) => [...prev, { ...notification, id }])

    // إزالة الإشعار بعد 3 ثوان
    const timeoutId = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      timeoutsRef.current.delete(id)
    }, 3000)
    timeoutsRef.current.set(id, timeoutId)
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    const timeout = timeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }
  }

  const clearNotifications = () => {
    setNotifications([])
    timeoutsRef.current.forEach((t) => clearTimeout(t))
    timeoutsRef.current.clear()
  }

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t))
      timeoutsRef.current.clear()
    }
  }, [])

  return (
    <AppContext.Provider
      value={{
        notifications,
        actions: {
          addNotification,
          removeNotification,
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
