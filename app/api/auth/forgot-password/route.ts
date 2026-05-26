import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Введите email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Безопасность: не сообщаем, существует ли email
    if (!user || !user.emailVerified) {
      return NextResponse.json({ success: true });
    }

    // Удаляем старые токены
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Генерируем токен
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@localhelp.ru",
      to: email,
      subject: "Восстановление пароля на Local Help",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">Local Help</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #111827; margin-top: 0;">Восстановление пароля</h2>
            <p style="color: #4b5563; line-height: 1.5;">Для восстановления пароля нажмите на кнопку ниже:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Восстановить пароль</a>
            <p style="color: #6b7280; font-size: 14px;">Ссылка действительна 1 час.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px;">Если вы не запрашивали восстановление, просто проигнорируйте это письмо.</p>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FORGOT_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { error: "Ошибка отправки письма" },
      { status: 500 }
    );
  }
}