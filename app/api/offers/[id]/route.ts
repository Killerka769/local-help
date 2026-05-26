import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
            description: true,
          },
        },
        request: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Отклик не найден" }, { status: 404 });
    }

    // Определяем права доступа
    let currentUserId: string | null = null;
    const token = req.cookies.get("token")?.value;

    if (token) {
      try {
        const { payload } = await jwtVerify(token, secret);
        currentUserId = payload.userId as string;
      } catch {
        // игнорируем
      }
    }

    const isAuthor = currentUserId === offer.request.authorId;
    const isOfferUser = currentUserId === offer.userId;
    const isApproved = offer.status === "approved";

    // Адрес и телефон показываются только после одобрения
    const canViewAddress = isApproved && (isAuthor || isOfferUser);
    const canViewPhone = isApproved && (isAuthor || isOfferUser);

    return NextResponse.json({
      ...offer,
      canApprove: isAuthor && offer.status === "pending" && offer.request.status === "active",
      canViewAddress,
      canViewPhone,
    });
  } catch (error) {
    console.error("[GET_OFFER_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const offer = await prisma.offer.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!offer) {
      return NextResponse.json({ error: "Отклик не найден" }, { status: 404 });
    }

    // Только автор может удалить
    if (offer.userId !== userId) {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

    // Нельзя удалить одобренный отклик
    if (offer.status === "approved") {
      return NextResponse.json(
        { error: "Нельзя удалить одобренный отклик" },
        { status: 400 }
      );
    }

    await prisma.offer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE_OFFER_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}