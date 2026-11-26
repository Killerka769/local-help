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

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        offers: {
          where: { status: { in: ["approved", "completed_by_executor"] } },
        },
      },
    });

    if (!request) {
      throw new HttpError(404, "Заявка не найдена");
    }

    if (request.authorId !== user.id) {
      throw new HttpError(403, "Нет прав");
    }

    if (request.status !== "active") {
      throw new HttpError(400, "Заявка уже закрыта");
    }

    const activeOffer = request.offers[0];

    await prisma.$transaction(async (tx) => {
      await tx.request.update({
        where: { id },
        data: { status: "closed" },
      });
      if (activeOffer) {
        await tx.notification.create({
          data: {
            userId: activeOffer.userId,
            type: "request_cancelled",
            title: "Заявка закрыта без выполнения",
            message: `Заказчик закрыл заявку «${request.title}» без подтверждения работы. Отзыв по ней оставить нельзя.`,
            link: `/requests/${request.id}`,
          },
        });
      }
    });

    return NextResponse.json({ success: true, withoutCompletion: true });
  } catch (error) {
    return handleRouteError(error, "[COMPLETE_REQUEST_ERROR]");
  }
}
