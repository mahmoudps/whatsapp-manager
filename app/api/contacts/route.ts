import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { verifyAuth } from "@/lib/middleware"
import { ValidationSchemas } from "@/lib/validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const contacts = await db.listContacts()
    return NextResponse.json({
      success: true,
      contacts,
      count: contacts.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في جلب جهات الاتصال",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const body = await request.json()
    const contactData = ValidationSchemas.contact(body)
    if (!contactData) {
      return NextResponse.json(
        {
          success: false,
          error: "بيانات جهة الاتصال غير صحيحة",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    const contact = await db.createContact(contactData.name, contactData.phoneNumber)
    return NextResponse.json(
      {
        success: true,
        contact,
        timestamp: new Date().toISOString(),
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في إنشاء جهة الاتصال",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
