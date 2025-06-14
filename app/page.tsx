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

const features = [
  {
    icon: Smartphone,
    title: "إدارة الأجهزة",
    description: "أضف أجهزة متعددة وتابع حالتها بسهولة",
  },
  {
    icon: Users,
    title: "الإرسال الجماعي",
    description: "أرسل رسائل لعدة جهات في وقت واحد",
  },
  {
    icon: Clock,
    title: "جدولة الرسائل",
    description: "حدد موعد الإرسال التلقائي للرسائل",
  },
  {
    icon: MessageSquare,
    title: "إدارة الرسائل",
    description: "تتبع الرسائل المرسلة والردود",
  },
  {
    icon: Activity,
    title: "التشخيص الفوري",
    description: "مراقبة حالة النظام والتنبيهات",
  },
  {
    icon: BarChart3,
    title: "إحصائيات وتقارير",
    description: "تحليلات مفصلة للأداء والاستخدام",
  },
]

export default function Home() {
  return (
    <motion.main
      className="min-h-screen bg-gradient-to-br from-sky-50 via-emerald-50 to-indigo-100 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="container mx-auto px-4 space-y-16">
        <section className="text-center space-y-6 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-800">مدير واتساب</h1>
          <p className="text-gray-600">
            منصة متكاملة لإدارة الأجهزة والرسائل مع دعم الإرسال الجماعي والجدولة
          </p>
          <div className="flex flex-col sm:flex-row sm:justify-center gap-4">
            <Link
              href="/login"
              className="btn-primary px-6 py-3 rounded-lg text-white"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/dashboard"
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200"
            >
              لوحة التحكم
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
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </motion.div>
            )
          })}
        </section>
      </div>
    </motion.main>
  )
}
