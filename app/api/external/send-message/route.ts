export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { whatsappManager } from "@/lib/whatsapp-client-manager";
import { db } from "@/lib/database";
import { ValidationSchemas } from "@/lib/validation";
import { EXTERNAL_API_KEY } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const apiKey =
      request.headers.get("x-api-key") ||
      new URL(request.url).searchParams.get("apiKey");

    if (!EXTERNAL_API_KEY || apiKey !== EXTERNAL_API_KEY) {
      return NextResponse.json(
        { success: false, error: "غير مصرح" },
        { status: 401 },
      );
    }

    const { deviceId, recipient, message } = await request.json();

    if (
      typeof deviceId !== "number" ||
      typeof recipient !== "string" ||
      typeof message !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "بيانات غير صالحة" },
        { status: 400 },
      );
    }

    await db.ensureInitialized();

    const messageData = ValidationSchemas.message({
      to: recipient,
      message,
    });

    if (!messageData) {
      return NextResponse.json(
        { success: false, error: "بيانات الرسالة غير صحيحة" },
        { status: 400 },
      );
    }

    const device = await db.getDeviceById(deviceId);
    if (!device) {
      return NextResponse.json(
        { success: false, error: "الجهاز غير موجود" },
        { status: 404 },
      );
    }

    if (!whatsappManager.isClientReady(deviceId)) {
      return NextResponse.json(
        { success: false, error: "الجهاز غير متصل" },
        { status: 400 },
      );
    }

    const success = await whatsappManager.sendMessage(
      deviceId,
      messageData.to,
      messageData.message,
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: "تم إرسال الرسالة بنجاح",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "فشل في إرسال الرسالة",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في الخادم",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
