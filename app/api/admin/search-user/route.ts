import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Введите номер телефона или ID" }, { status: 400 });
    }

    const trimmedQuery = query.trim();

    // Определяем, что ищем: по телефону или по ID
    let user = null;

    if (trimmedQuery.startsWith("+") || /^\d{10,11}$/.test(trimmedQuery)) {
      // Поиск по телефону
      const phone = trimmedQuery.replace(/[^0-9]/g, "");
      user = await prisma.user.findUnique({
        where: { phone },
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
          role: true,
          isBlocked: true,
          rating: true,
          createdAt: true,
          city: { select: { name: true } },
          _count: {
            select: { requests: true, offers: true },
          },
        },
      });
    } else {
      // Поиск по ID
      user = await prisma.user.findUnique({
        where: { id: trimmedQuery },
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
          role: true,
          isBlocked: true,
          rating: true,
          createdAt: true,
          city: { select: { name: true } },
          _count: {
            select: { requests: true, offers: true },
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...user,
        cityName: user.city?.name,
      },
    });
  } catch (error) {
    console.error("[ADMIN_SEARCH_USER_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}