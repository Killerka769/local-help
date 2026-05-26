import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        offers: {
          where: { status: "approved" },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    if (request.authorId !== userId) {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

    if (request.status !== "active") {
      return NextResponse.json(
        { error: "Заявка уже закрыта" },
        { status: 400 }
      );
    }

    const approvedOffer = request.offers[0];

    if (!approvedOffer) {
      return NextResponse.json(
        { error: "Нет одобренного отклика" },
        { status: 400 }
      );
    }

    // Закрываем заявку и отмечаем отклик как выполненный
    await prisma.$transaction([
      prisma.request.update({
        where: { id },
        data: { status: "closed" },
      }),
      prisma.offer.update({
        where: { id: approvedOffer.id },
        data: { status: "completed" },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[COMPLETE_REQUEST_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}