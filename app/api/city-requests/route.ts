import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireUser(req);
    const userId = authUser.id;

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
    return handleRouteError(error, "[CITY_REQUEST_ERROR]");
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

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
    return handleRouteError(error, "[CITY_REQUESTS_GET_ERROR]");
  }
}