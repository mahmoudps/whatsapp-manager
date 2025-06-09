"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  Zap,
  Activity,
  MessageSquare,
  Smartphone,
} from "lucide-react"
// @ts-ignore next-themes types may be missing
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/use-auth"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [notifications] = useState([
    { id: 1, title: "جهاز جديد متصل", message: "تم توصيل جهاز iPhone 13", time: "منذ دقيقتين", type: "success" },
    {
      id: 2,
      title: "رسالة فاشلة",
      message: "فشل في إرسال رسالة إلى +966501234567",
      time: "منذ 5 دقائق",
      type: "error",
    },
    { id: 3, title: "تحديث النظام", message: "تم تحديث النظام بنجاح", time: "منذ ساعة", type: "info" },
  ])

  const quickSearchResults = [
    { type: "device", name: "iPhone 13 Pro", status: "متصل", icon: Smartphone },
    { type: "message", name: "رسالة إلى العميل أحمد", status: "مرسلة", icon: MessageSquare },
    { type: "action", name: "إضافة جهاز جديد", status: "إجراء", icon: Zap },
  ]

  const filteredResults = quickSearchResults.filter((item) =>
    item.name.toLowerCase().includes(searchValue.toLowerCase()),
  )

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/80"
    >
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Mobile Menu Button */}
        <Button variant="ghost" size="sm" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <motion.div
            animate={{
              scale: searchFocused ? 1.02 : 1,
            }}
            className="relative"
          >
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="البحث في الأجهزة والرسائل..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className={cn(
                "pr-10 transition-all duration-200",
                searchFocused && "ring-2 ring-blue-500/20 border-blue-300",
              )}
            />
          </motion.div>

          {/* Search Results */}
          <AnimatePresence>
            {searchFocused && searchValue && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                {filteredResults.length > 0 ? (
                  <div className="space-y-1">
                    {filteredResults.map((result, index) => {
                      const Icon = result.icon
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 rounded-md p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{result.name}</p>
                            <p className="text-xs text-gray-500">{result.status}</p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">لا توجد نتائج</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* System Status */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="hidden sm:flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-1.5"
          >
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">النظام يعمل</span>
          </motion.div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            <motion.div initial={false} animate={{ rotate: theme === "dark" ? 180 : 0 }} transition={{ duration: 0.3 }}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.div>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center"
                  >
                    <span className="text-xs font-bold text-white">{notifications.length}</span>
                  </motion.div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                الإشعارات
                <Badge variant="secondary">{notifications.length}</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex-col items-start p-3">
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          notification.type === "success" && "bg-green-500",
                          notification.type === "error" && "bg-red-500",
                          notification.type === "info" && "bg-blue-500",
                        )}
                      />
                      <span className="font-medium text-sm">{notification.title}</span>
                      <span className="text-xs text-gray-500 mr-auto">{notification.time}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mr-4">{notification.message}</p>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-gray-500">مدير النظام</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                الملف الشخصي
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                الإعدادات
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Activity className="mr-2 h-4 w-4" />
                سجل النشاط
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  )
}
