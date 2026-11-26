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

    if (offer.userId !== user.id) {
      throw new HttpError(403, "Нет прав");
    }

    if (offer.status !== "approved") {
      throw new HttpError(400, "Отклик ещё не одобрен заказчиком");
    }

    if (offer.request.status !== "active") {
      throw new HttpError(400, "Заявка уже закрыта");
    }

    await prisma.$transaction(async (tx) => {
      await tx.offer.update({
        where: { id },
        data: { status: "completed_by_executor" },
      });
      await tx.notification.create({
        data: {
          userId: offer.request.authorId,
          type: "executor_completed",
          title: "Исполнитель завершил работу",
          message: `Подтвердите выполнение заявки «${offer.request.title}», если работа сделана. После этого можно оставить отзыв.`,
          link: `/offers/${offer.id}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "[COMPLETE_BY_EXECUTOR_ERROR]");
  }
}
