<<<<<<< HEAD
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">مدير واتساب</h1>
        <p className="text-gray-600 mb-8">نظام إدارة شامل لرسائل واتساب</p>
        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/dashboard"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
          >
            لوحة التحكم
          </Link>
        </div>
      </div>
    </main>
=======
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"

export default function Page() {
  return (
    <div className="container mx-auto py-10">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>WhatsApp Manager</CardTitle>
          <CardDescription>Welcome to your WhatsApp management dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Get started by exploring the available features.</p>
        </CardContent>
        <CardFooter>
          <Button>Explore</Button>
        </CardFooter>
      </Card>
    </div>
>>>>>>> 83e0b5f7cbb5c54a0d6a252d420d7c6ecc85a6da
  )
}
