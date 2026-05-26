import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
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

    const { cityName } = await req.json();

    if (!cityName || cityName.trim().length < 2) {
      return NextResponse.json(
        { error: "Введите корректное название города" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли уже заявка от этого пользователя на этот город
    const existing = await prisma.cityRequest.findFirst({
      where: {
        userId,
        cityName: cityName.trim(),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Вы уже оставляли заявку на этот город" },
        { status: 400 }
      );
    }

    const cityRequest = await prisma.cityRequest.create({
      data: {
        cityName: cityName.trim(),
        userId,
      },
    });

    return NextResponse.json({ success: true, id: cityRequest.id });
  } catch (error) {
    console.error("[CITY_REQUEST_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// GET — для админа (просмотр всех заявок)
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

    const requests = await prisma.cityRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("[CITY_REQUESTS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}