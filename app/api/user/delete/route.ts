import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: "Введите пароль для подтверждения" },
        { status: 400 }
      );
    }

    // Получаем пользователя с паролем
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Неверный пароль" },
        { status: 400 }
      );
    }

    // Удаляем все связанные данные
    await prisma.$transaction([
      // Удаляем отклики пользователя
      prisma.offer.deleteMany({ where: { userId } }),
      // Удаляем избранное
      prisma.favorite.deleteMany({ where: { userId } }),
      // Удаляем жалобы, отправленные пользователем
      prisma.complaint.deleteMany({ where: { userId } }),
      // Удаляем отзывы, написанные пользователем
      prisma.review.deleteMany({ where: { fromUserId: userId } }),
      // Удаляем заявки пользователя (каскадно удалятся отклики на них)
      prisma.request.deleteMany({ where: { authorId: userId } }),
      // Удаляем уведомления
      prisma.notification.deleteMany({ where: { userId } }),
      // Удаляем заявки на города
      prisma.cityRequest.deleteMany({ where: { userId } }),
      // Наконец, удаляем самого пользователя
      prisma.user.delete({ where: { id: userId } }),
    ]);

    // Очищаем cookie с токеном
    const response = NextResponse.json({ success: true });
    response.cookies.delete("token");

    return response;
  } catch (error) {
    console.error("[DELETE_ACCOUNT_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}