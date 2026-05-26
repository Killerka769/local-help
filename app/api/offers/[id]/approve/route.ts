import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

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

    const userBlock = await prisma.user.findUnique({
      where: { id: userId },
      select: { isBlocked: true, role: true },
    });
    
    if (userBlock?.isBlocked) {
      return NextResponse.json(
        { error: 'Ваш аккаунт заблокирован' },
        { status: 403 }
      );
    }

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        request: true,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Отклик не найден" }, { status: 404 });
    }

    // Проверяем, что текущий пользователь — автор заявки
    if (offer.request.authorId !== userId) {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

    if (offer.request.status !== "active") {
      return NextResponse.json(
        { error: "Заявка уже закрыта или истёк срок" },
        { status: 400 }
      );
    }

    if (offer.status !== "pending") {
      return NextResponse.json(
        { error: "Отклик уже обработан" },
        { status: 400 }
      );
    }

    // Находим все отклоняемые отклики
    const rejectedOffers = await prisma.offer.findMany({
      where: {
        requestId: offer.requestId,
        id: { not: id },
        status: "pending",
      },
    });

    // Одобряем текущий отклик, остальные отклоняем
    await prisma.$transaction([
      prisma.offer.update({
        where: { id },
        data: { status: "approved" },
      }),
      prisma.offer.updateMany({
        where: {
          requestId: offer.requestId,
          id: { not: id },
          status: "pending",
        },
        data: { status: "rejected" },
      }),
    ]);

    // Уведомление исполнителю (одобренный отклик)
    await createNotification({
      userId: offer.userId,
      type: "offer_approved",
      title: "Отклик одобрен",
      message: `Ваш отклик на заявку "${offer.request.title}" одобрен. Свяжитесь с заказчиком`,
      link: `/offers/${offer.id}`,
    });

    // Уведомления всем отклонённым исполнителям
    for (const rejectedOffer of rejectedOffers) {
      await createNotification({
        userId: rejectedOffer.userId,
        type: "offer_rejected",
        title: "Отклик отклонён",
        message: `Ваш отклик на заявку "${offer.request.title}" отклонён`,
        link: `/requests/${offer.requestId}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[APPROVE_OFFER_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}