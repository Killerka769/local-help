import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: NextRequest) {
  try {
    // 1. Переводим просроченные заявки в статус expired
    const now = new Date()

    // Получаем все активные заявки
    const activeRequests = await prisma.request.findMany({
      where: { status: "active" },
      select: { id: true, createdAt: true, deadline: true },
    })

    // Фильтруем те, у которых истёк срок
    const expiredIds = activeRequests
      .filter(req => {
        const expiryDate = new Date(req.createdAt)
        expiryDate.setDate(expiryDate.getDate() + req.deadline)
        return expiryDate < now
      })
      .map(req => req.id)

    // Обновляем просроченные
    if (expiredIds.length > 0) {
      await prisma.request.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: "expired" },
      })
    }
    // 2. Получаем параметры запроса
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const deadlineFilter = searchParams.get("deadline");
    const budgetMin = searchParams.get("budgetMin");
    const budgetMax = searchParams.get("budgetMax");
    const sortBy = searchParams.get("sortBy") || "date";
    const search = searchParams.get("search") || "";
    const cityFilter = searchParams.get("city"); // фильтр по городу (опционально)

    // 3. Получаем город пользователя из токена
    let userCityId: string | null = null;
    let currentUserId: string | null = null;
    const token = req.cookies.get("token")?.value;

    if (token) {
      try {
        const { payload } = await jwtVerify(token, secret);
        currentUserId = payload.userId as string;
        const user = await prisma.user.findUnique({
          where: { id: currentUserId },
          select: { cityId: true },
        });
        userCityId = user?.cityId || null;
      } catch {
        // игнорируем
      }
    }

    // 4. Определяем город для фильтрации
    // Если передан параметр city — используем его
    // Иначе используем город пользователя
    // Если города нет — показываем все заявки
    let targetCityId: string | null = null;
    if (cityFilter && cityFilter !== "all") {
      targetCityId = cityFilter;
    } else if (userCityId) {
      targetCityId = userCityId;
    }

    // 5. Строим where фильтр
    const where: Prisma.RequestWhereInput = {
      status: "active",
      ...(targetCityId && { cityId: targetCityId }),
      ...(deadlineFilter && deadlineFilter !== "all" && { deadline: parseInt(deadlineFilter) }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    if (budgetMin || budgetMax) {
      where.budget = {};
      if (budgetMin) where.budget.gte = parseInt(budgetMin);
      if (budgetMax) where.budget.lte = parseInt(budgetMax);
    }

    // 6. Сортировка
    let orderBy: Prisma.RequestOrderByWithRelationInput = {};
    switch (sortBy) {
      case "budget_asc":
        orderBy = { budget: "asc" };
        break;
      case "budget_desc":
        orderBy = { budget: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          city: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.request.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      currentCityId: userCityId,
    });
  } catch (error) {
    console.error("[FEED_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}