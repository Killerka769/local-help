import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { isValidText } from "@/utils/badWords";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { checkDailyLimit, incrementDailyLimit } from "@/lib/dailyLimits";
import { requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";

const limiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 20 });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { success } = limiter.check(getRateLimitKey(req, "requests-id-offer"));
    if (!success) {
      return NextResponse.json(
        { error: "Слишком много запросов. Подождите немного." },
        { status: 429 }
      );
    }

    const { id } = await params;
    const authUser = await requireUser(req);

    const limitCheck = await checkDailyLimit(authUser.id, "offer");
    if (!limitCheck.allowed) {
      throw new HttpError(
        429,
        `Вы превысили лимит на отклики. Можно откликнуться не более ${limitCheck.limit} раз в день.`
      );
    }

    const { comment } = await req.json();

    const commentValidation = isValidText(comment, "Комментарий");
    if (!commentValidation.valid) {
      throw new HttpError(400, commentValidation.error || "Неверный комментарий");
    }

    if (!comment || comment.trim().length < 5) {
      throw new HttpError(400, "Комментарий должен быть минимум 5 символов");
    }

    const request = await prisma.request.findUnique({
      where: { id },
    });

    if (!request) {
      throw new HttpError(404, "Заявка не найдена");
    }

    if (request.status !== "active" || request.expiresAt <= new Date()) {
      throw new HttpError(400, "Заявка уже закрыта или истёк срок");
    }

    if (request.authorId === authUser.id) {
      throw new HttpError(400, "Нельзя откликнуться на свою заявку");
    }

    const existingOffer = await prisma.offer.findUnique({
      where: {
        requestId_userId: {
          requestId: id,
          userId: authUser.id,
        },
      },
    });

    if (existingOffer) {
      throw new HttpError(400, "Вы уже откликнулись на эту заявку");
    }

    const offer = await prisma.offer.create({
      data: {
        comment,
        requestId: id,
        userId: authUser.id,
        status: "pending",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    await incrementDailyLimit(authUser.id, "offer");

    await createNotification({
      userId: request.authorId,
      type: "new_offer",
      title: "Новый отклик",
      message: `${authUser.name || "Пользователь"} откликнулся на вашу заявку "${request.title}"`,
      link: `/requests/${request.id}`,
    });

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "[CREATE_OFFER_ERROR]");
  }
}
