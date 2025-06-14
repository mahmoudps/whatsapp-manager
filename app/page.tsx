"use client"

import Link from "next/link"
import {
  Smartphone,
  Users,
  Clock,
  MessageSquare,
  Activity,
  BarChart3,
} from "lucide-react"
import { motion } from "framer-motion"
import { useTranslation } from "@/lib/i18n"

const features = [
  { icon: Smartphone, title: "features.devices_title", desc: "features.devices_desc" },
  { icon: Users, title: "features.bulk_title", desc: "features.bulk_desc" },
  { icon: Clock, title: "features.schedule_title", desc: "features.schedule_desc" },
  { icon: MessageSquare, title: "features.messages_title", desc: "features.messages_desc" },
  { icon: Activity, title: "features.diagnostics_title", desc: "features.diagnostics_desc" },
  { icon: BarChart3, title: "features.stats_title", desc: "features.stats_desc" },
]

export default function Home() {
  const { t } = useTranslation()
  return (
    <motion.main
      className="min-h-screen bg-gradient-to-br from-sky-50 via-emerald-50 to-indigo-100 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="container mx-auto px-4 space-y-16">
        <section className="text-center space-y-6 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-800">{t('home.heading')}</h1>
          <p className="text-gray-600">{t('home.subheading')}</p>
          <div className="flex flex-col sm:flex-row sm:justify-center gap-4">
            <Link href="/login" className="btn-primary px-6 py-3 rounded-lg text-white">
              {t('home.login')}
            </Link>
            <Link href="/dashboard" className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200">
              {t('home.dashboard')}
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl shadow card-hover p-6 text-center"
              >
                <Icon className="h-8 w-8 mx-auto text-blue-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{t(feature.title)}</h3>
                <p className="text-sm text-gray-500">{t(feature.desc)}</p>
              </motion.div>
            )
          })}
        </section>
      </div>
    </motion.main>
  )
}
