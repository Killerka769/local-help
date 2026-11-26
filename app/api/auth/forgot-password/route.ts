import { NextRequest, NextResponse } from "next/server";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { SUPPORT_CONTACT } from "@/lib/support";

const limiter = rateLimit({ windowMs: 60 * 60 * 1000, maxRequests: 5 });

export async function POST(req: NextRequest) {
  try {
    const { success } = limiter.check(getRateLimitKey(req, "forgot-password"));
    if (!success) {
      return NextResponse.json(
        { error: "Слишком много запросов. Подождите немного." },
        { status: 429 }
      );
    }

    await req.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: `Почта не подключена. Напишите в поддержку: ${SUPPORT_CONTACT || "контакт из SUPPORT_CONTACT"}`,
    });
  } catch {
    return NextResponse.json({
      success: true,
      message: `Почта не подключена. Напишите в поддержку: ${SUPPORT_CONTACT || "контакт из SUPPORT_CONTACT"}`,
    });
  }
}
