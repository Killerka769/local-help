import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Введите корректный email" }, { status: 400 });
    }

    // Проверяем, не занят ли email другим пользователем
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: "Этот email уже используется другим пользователем" },
        { status: 400 }
      );
    }

    // Генерируем токен
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

    // Удаляем старые токены для этого пользователя
    await prisma.emailVerificationToken.deleteMany({
      where: { userId },
    });

    // Создаём новый токен
    await prisma.emailVerificationToken.create({
      data: {
        userId,
        token: verificationToken,
        email,
        expiresAt,
      },
    });

    // Отправляем письмо
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "gaydar.123@mail.ru",
      to: email,
      subject: "Подтверждение email на Local Help",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">Local Help</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #111827; margin-top: 0;">Подтверждение email</h2>
            <p style="color: #4b5563; line-height: 1.5;">Для подтверждения email нажмите на кнопку ниже:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Подтвердить email</a>
            <p style="color: #6b7280; font-size: 14px;">Ссылка действительна 24 часа.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px;">Если вы не запрашивали подтверждение, просто проигнорируйте это письмо.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Sending email to:", email);
    console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
    console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
    console.log("🔗 VERIFICATION LINK:", verificationUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SEND_VERIFICATION_ERROR]", error);
    return NextResponse.json(
      { error: "Ошибка отправки письма" },
      { status: 500 }
    );
  }
}