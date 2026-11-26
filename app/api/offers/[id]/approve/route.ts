import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser(req);

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { request: true },
    });

    if (!offer) {
      throw new HttpError(404, "Отклик не найден");
    }

    if (offer.request.authorId !== user.id) {
      throw new HttpError(403, "Нет прав");
    }

    const rejectedOffers = await prisma.$transaction(async (tx) => {
      const approved = await tx.offer.updateMany({
        where: {
          id,
          status: "pending",
          request: {
            authorId: user.id,
            status: "active",
          },
        },
        data: { status: "approved" },
      });

      if (approved.count !== 1) {
        throw new HttpError(400, "Отклик уже обработан или заявка закрыта");
      }

      const pending = await tx.offer.findMany({
        where: {
          requestId: offer.requestId,
          id: { not: id },
          status: "pending",
        },
      });

      await tx.offer.updateMany({
        where: {
          requestId: offer.requestId,
          id: { not: id },
          status: "pending",
        },
        data: { status: "rejected" },
      });

      return pending;
    });

    await createNotification({
      userId: offer.userId,
      type: "offer_approved",
      title: "Отклик одобрен",
      message: `Ваш отклик на заявку "${offer.request.title}" одобрен. Свяжитесь с заказчиком`,
      link: `/offers/${offer.id}`,
    });

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
    return handleRouteError(error, "[APPROVE_OFFER_ERROR]");
  }
}
