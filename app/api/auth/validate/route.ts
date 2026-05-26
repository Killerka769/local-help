import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ isValid: false }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const tokenSessionVersion = payload.sessionVersion as number || 0;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sessionVersion: true, isBlocked: true, blockedReason: true, blockedUntil: true },
    });

    if (!user) {
      return NextResponse.json({ isValid: false }, { status: 401 });
    }

    // Проверяем sessionVersion
    if (tokenSessionVersion !== user.sessionVersion) {
      return NextResponse.json({ isValid: false }, { status: 401 });
    }

    // Проверяем, не истёк ли срок блокировки
    let isBlocked = user.isBlocked;
    if (user.blockedUntil && new Date(user.blockedUntil) < new Date()) {
      // Автоматическая разблокировка
      await prisma.user.update({
        where: { id: userId },
        data: {
          isBlocked: false,
          blockedBy: null,
          blockedReason: null,
          blockedUntil: null,
          bannedAt: null,
        },
      });
      isBlocked = false;
    }

    // Валидный токен — возвращаем true, даже если пользователь заблокирован
    // Блокировка проверяется отдельно, но токен остаётся валидным
    return NextResponse.json({ 
      isValid: true, 
      isBlocked,
      blockedReason: user.blockedReason,
      blockedUntil: user.blockedUntil,
    });
  } catch (error) {
    console.error("[VALIDATE_TOKEN_ERROR]", error);
    return NextResponse.json({ isValid: false }, { status: 401 });
  }
}