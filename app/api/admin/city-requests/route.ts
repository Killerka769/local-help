import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    // Группируем заявки по городам
    const cityRequests = await prisma.cityRequest.groupBy({
      by: ["cityName"],
      _count: {
        id: true,
      },
      where: {
        status: "pending",
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    // Для каждого города получаем список пользователей, которые оставили заявку
    const citiesWithDetails = await Promise.all(
      cityRequests.map(async (city) => {
        const requests = await prisma.cityRequest.findMany({
          where: {
            cityName: city.cityName,
            status: "pending",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        });

        return {
          cityName: city.cityName,
          votes: city._count.id,
          requests,
        };
      })
    );

    return NextResponse.json({ cities: citiesWithDetails });
  } catch (error) {
    console.error("[ADMIN_CITY_REQUESTS_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// Одобрить город (создать в таблице City и отметить все заявки как approved)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const { cityName } = await req.json();

    if (!cityName) {
      return NextResponse.json({ error: "Название города обязательно" }, { status: 400 });
    }

    // Проверяем, существует ли уже город
    const existingCity = await prisma.city.findUnique({
      where: { name: cityName },
    });

    if (!existingCity) {
      // Создаём город
      await prisma.city.create({
        data: {
          name: cityName,
          region: "Новый регион", // можно потом отредактировать
        },
      });
    }

    // Обновляем статус всех заявок на этот город
    await prisma.cityRequest.updateMany({
      where: {
        cityName,
        status: "pending",
      },
      data: {
        status: "approved",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_CITY_APPROVE_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// Отклонить все заявки на город
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const cityName = searchParams.get("cityName");

    if (!cityName) {
      return NextResponse.json({ error: "Название города обязательно" }, { status: 400 });
    }

    await prisma.cityRequest.updateMany({
      where: {
        cityName,
        status: "pending",
      },
      data: {
        status: "rejected",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_CITY_REJECT_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}