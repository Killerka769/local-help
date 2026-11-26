import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";
import { validatePassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Заполните все поля" },
        { status: 400 }
      );
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Новый пароль и подтверждение не совпадают" },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "Новый пароль должен отличаться от текущего" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Неверный текущий пароль" },
        { status: 400 }
      );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        sessionVersion: { increment: 1 },
      },
    });

    const response = NextResponse.json({ success: true });
    response.cookies.delete("token");
    return response;
  } catch (error) {
    return handleRouteError(error, "[CHANGE_PASSWORD_ERROR]");
  }
}
