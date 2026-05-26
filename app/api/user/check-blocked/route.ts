import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ isBlocked: false });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        isBlocked: true, 
        blockedUntil: true,
        blockedReason: true,
        blockedBy: true,
        bannedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ isBlocked: false });
    }

    // Проверяем, истёк ли срок блокировки
    let isBlocked = user.isBlocked;
    if (user.blockedUntil && new Date(user.blockedUntil) < new Date()) {
      // Срок истёк — автоматически разблокируем
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

    // Получаем имя того, кто заблокировал
    let blockedByName = null;
    if (user.blockedBy) {
      const admin = await prisma.user.findUnique({
        where: { id: user.blockedBy },
        select: { name: true },
      });
      blockedByName = admin?.name;
    }

    return NextResponse.json({
      isBlocked,
      blockedReason: user.blockedReason,
      blockedUntil: user.blockedUntil,
      bannedAt: user.bannedAt,
      blockedByName,
    });
  } catch (error) {
    console.error("[CHECK_BLOCKED_ERROR]", error);
    return NextResponse.json({ isBlocked: false });
  }
}