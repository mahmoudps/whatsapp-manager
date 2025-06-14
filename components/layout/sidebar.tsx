"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  Smartphone,
  MessageSquare,
  Settings,
  Activity,
  BarChart3,
  X,
  ChevronRight,
  Zap,
  Shield,
  HelpCircle,
  CalendarClock,
  Send,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface SidebarProps {
  onClose?: () => void
}

const navigation = [
  {
    name: "لوحة التحكم",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
    description: "نظرة عامة على النظام",
  },
  {
    name: "الأجهزة",
    href: "/devices",
    icon: Smartphone,
    badge: "جديد",
    description: "إدارة أجهزة WhatsApp",
  },
  {
    name: "الرسائل",
    href: "/messages",
    icon: MessageSquare,
    badge: null,
    description: "عرض وإدارة الرسائل",
  },
  {
    name: "الإرسال الجماعي",
    href: "#",
    icon: Send,
    badge: "قريباً",
    description: "هذه الميزة غير مفعلة حالياً",
    disabled: true,
  },
  {
    name: "جدولة الرسائل",
    href: "#",
    icon: CalendarClock,
    badge: "قريباً",
    description: "هذه الميزة غير مفعلة حالياً",
    disabled: true,
  },
  {
    name: "التشخيص",
    href: "/diagnostics",
    icon: Activity,
    badge: null,
    description: "مراقبة حالة النظام",
  },
  {
    name: "الإعدادات",
    href: "/settings",
    icon: Settings,
    badge: null,
    description: "إعدادات التطبيق",
  },
]

const quickActions = [
  {
    name: "إضافة جهاز",
    icon: Smartphone,
    action: "add-device",
    color: "bg-blue-500",
  },
  {
    name: "إرسال رسالة",
    icon: MessageSquare,
    action: "send-message",
    color: "bg-green-500",
  },
  {
    name: "عرض الإحصائيات",
    icon: BarChart3,
    action: "view-stats",
    color: "bg-purple-500",
  },
]

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="flex h-full w-72 flex-col bg-white/80 backdrop-blur-xl border-l border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-700/50 shadow-2xl"
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WhatsApp Manager
            </h2>
            <p className="text-xs text-muted-foreground">إدارة متقدمة</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            const isDisabled = item.disabled

            return (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setHoveredItem(item.name)}
                onHoverEnd={() => setHoveredItem(null)}
              >
                {isDisabled ? (
                  <div
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 cursor-not-allowed opacity-60",
                      "bg-gray-100 dark:bg-gray-800",
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <AnimatePresence>
                        {hoveredItem === item.name && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                          >
                            {item.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                      "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white",
                    )}
                    onClick={onClose}
                  >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-white/20"
                        : "bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span>{item.name}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <AnimatePresence>
                      {hoveredItem === item.name && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                        >
                          {item.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  <ChevronRight
                    className={cn("h-4 w-4 transition-transform", isActive ? "rotate-90" : "group-hover:translate-x-1")}
                  />
                  </Link>
                )}
              </motion.div>
            )
          })}
        </div>

        <Separator className="my-4" />

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3">
            إجراءات سريعة
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <motion.button
                  key={action.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className={cn("h-6 w-6 rounded-md flex items-center justify-center", action.color)}>
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                  <span>{action.name}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">نظام آمن</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">محمي بالكامل</p>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="w-full mt-2 justify-start">
          <HelpCircle className="h-4 w-4 mr-2" />
          المساعدة والدعم
        </Button>
      </div>
    </motion.div>
  )
}
