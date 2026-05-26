import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatar: true,
        description: true,
        cityId: true,
        createdAt: true,
        isBlocked: true,
        blockedReason: true,
        blockedUntil: true,
        blockedBy: true,
        role: true,
        rating: true,
        _count: {
          select: {
            requests: true,
            offers: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Получаем название города
    const city = await prisma.city.findUnique({
      where: { id: user.cityId },
      select: { name: true },
    });

    // Получаем имя того, кто заблокировал (если есть)
    let blockedByName = null;
    if (user?.blockedBy) {
      const admin = await prisma.user.findUnique({
        where: { id: user.blockedBy },
        select: { name: true },
      });
      blockedByName = admin?.name;
    }

    // Считаем выполненные заявки
    const completedCount = await prisma.offer.count({
      where: {
        userId: id,
        status: "completed",
      },
    });

    // Получаем активные заявки пользователя
    const activeRequests = await prisma.request.findMany({
      where: {
        authorId: id,
        status: "active",
      },
      include: {
        city: { select: { name: true } },
        _count: {
          select: { offers: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10, // ограничиваем для производительности
    });

    return NextResponse.json({
      user: {
        ...user,
        cityName: city?.name || "Не указан",
        completedCount,
        blockedByName,
      },
      activeRequests,
    });
  } catch (error) {
    console.error("[USER_PROFILE_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}