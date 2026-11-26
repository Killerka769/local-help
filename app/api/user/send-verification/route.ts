import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";
import { getSiteUrl } from "@/lib/jwt";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

const limiter = rateLimit({ windowMs: 60 * 60 * 1000, maxRequests: 5 });

export async function POST(req: NextRequest) {
  try {
    const { success } = limiter.check(getRateLimitKey(req, "send-verification"));
    if (!success) {
      throw new HttpError(429, "Слишком много запросов. Подождите немного.");
    }

    const user = await requireUser(req);

    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      throw new HttpError(
        503,
        "Почта на сервере не настроена. Напишите в поддержку, чтобы подтвердить email позже."
      );
    }

    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, "Введите корректный email");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== user.id) {
      throw new HttpError(400, "Этот email уже используется другим пользователем");
    }

    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        email,
        expiresAt,
      },
    });

    const verificationUrl = `${getSiteUrl()}/verify-email?token=${verificationToken}`;
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Подтверждение email на Local Help",
      html: `
        <p>Для подтверждения email на Local Help откройте ссылку:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Ссылка действительна 24 часа.</p>
      `,
    });

    if (result.error) {
      throw new HttpError(503, "Не удалось отправить письмо. Почта ещё не настроена.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "[SEND_VERIFICATION_ERROR]");
  }
}
