import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Неверная ссылка" }, { status: 400 });
    }

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/settings?emailError=invalid", process.env.NEXTAUTH_URL)
      );
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } });
      return NextResponse.redirect(
        new URL("/settings?emailError=expired", process.env.NEXTAUTH_URL)
      );
    }

    // Обновляем пользователя
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        email: verificationToken.email,
        emailVerified: true,
      },
    });

    // Удаляем токен
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    return NextResponse.redirect(
      new URL("/settings?emailVerified=true", process.env.NEXTAUTH_URL)
    );
  } catch (error) {
    console.error("[VERIFY_EMAIL_ERROR]", error);
    return NextResponse.redirect(
      new URL("/settings?emailError=server", process.env.NEXTAUTH_URL)
    );
  }
}