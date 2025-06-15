export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { verifyAuth, buildUnauthorizedResponse } from "@/lib/auth"
import { ValidationSchemas } from "@/lib/validation"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return buildUnauthorizedResponse(authResult)
    }

    // Ensure database is initialized
    await db.ensureInitialized()

    const contactId = Number.parseInt(id)
    if (isNaN(contactId)) {
      return NextResponse.json(
        { success: false, error: "معرف غير صالح", timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }

    const contact = await db.getContact(contactId)
    if (!contact) {
      return NextResponse.json(
        { success: false, error: "جهة الاتصال غير موجودة", timestamp: new Date().toISOString() },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, contact, timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في جلب جهة الاتصال",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return buildUnauthorizedResponse(authResult)
    }

    // Ensure database is initialized
    await db.ensureInitialized()

    const contactId = Number.parseInt(id)
    if (isNaN(contactId)) {
      return NextResponse.json(
        { success: false, error: "معرف غير صالح", timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }

    const body = await request.json()
    const contactData = ValidationSchemas.contact(body)
    if (!contactData) {
      return NextResponse.json(
        { success: false, error: "بيانات جهة الاتصال غير صحيحة", timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }

    await db.updateContact(contactId, contactData)
    const updated = await db.getContact(contactId)
    return NextResponse.json({ success: true, contact: updated, timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في تحديث جهة الاتصال",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return buildUnauthorizedResponse(authResult)
    }

    // Ensure database is initialized
    await db.ensureInitialized()

    const contactId = Number.parseInt(id)
    if (isNaN(contactId)) {
      return NextResponse.json(
        { success: false, error: "معرف غير صالح", timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }

    await db.deleteContact(contactId)
    return NextResponse.json({ success: true, message: "تم حذف جهة الاتصال", timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في حذف جهة الاتصال",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
