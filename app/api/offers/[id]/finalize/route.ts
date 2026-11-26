import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    if (offer.request.status !== "active") {
      throw new HttpError(400, "Заявка уже закрыта");
    }

    if (offer.status !== "completed_by_executor") {
      throw new HttpError(400, "Исполнитель ещё не подтвердил выполнение");
    }

    await prisma.$transaction(async (tx) => {
      await tx.request.update({
        where: { id: offer.requestId },
        data: { status: "closed" },
      });
      await tx.offer.update({
        where: { id },
        data: { status: "completed" },
      });
      await tx.notification.create({
        data: {
          userId: offer.userId,
          type: "request_completed",
          title: "Заявка завершена",
          message: `Заказчик подтвердил выполнение работы по заявке «${offer.request.title}». Можете оставить отзыв.`,
          link: `/requests/${offer.requestId}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "[FINALIZE_REQUEST_ERROR]");
  }
}
