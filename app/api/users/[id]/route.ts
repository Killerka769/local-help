import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireOverdueRequests } from "@/lib/requestExpiry";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await expireOverdueRequests();
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

    const city = await prisma.city.findUnique({
      where: { id: user.cityId },
      select: { name: true },
    });

    const completedCount = await prisma.offer.count({
      where: {
        userId: id,
        status: "completed",
      },
    });

    const activeRequests = await prisma.request.findMany({
      where: {
        authorId: id,
        status: "active",
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        title: true,
        description: true,
        address: true,
        budget: true,
        deadline: true,
        status: true,
        createdAt: true,
        city: { select: { name: true } },
        _count: {
          select: { offers: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      user: {
        ...user,
        cityName: city?.name || "Не указан",
        completedCount,
      },
      activeRequests: activeRequests.map(({ address, ...rest }) => ({
        ...rest,
        district: address,
      })),
    });
  } catch (error) {
    console.error("[USER_PROFILE_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
