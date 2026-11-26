import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidText } from "@/utils/badWords";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";

const limiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 10 });

export async function POST(req: NextRequest) {
  try {
    const { success } = limiter.check(getRateLimitKey(req, "reviews"));
    if (!success) {
      throw new HttpError(429, "Слишком много запросов. Подождите немного.");
    }

    const user = await requireUser(req);
    const fromUserId = user.id;
    const { toUserId, requestId, rating, comment } = await req.json();

    if (comment) {
      const commentValidation = isValidText(comment, "Комментарий отзыва");
      if (!commentValidation.valid) {
        throw new HttpError(400, commentValidation.error || "Неверный комментарий");
      }
    }

    if (!toUserId || !requestId || !rating) {
      throw new HttpError(400, "Заполните все обязательные поля");
    }

    if (rating < 1 || rating > 5) {
      throw new HttpError(400, "Оценка должна быть от 1 до 5");
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        offers: {
          where: { status: "completed" },
          select: { userId: true },
        },
      },
    });

    if (!request || request.status !== "closed") {
      throw new HttpError(400, "Можно оставить отзыв только на завершённую заявку");
    }

    const isParticipant =
      request.authorId === fromUserId ||
      request.offers.some((o) => o.userId === fromUserId);
    const isTargetParticipant =
      request.authorId === toUserId ||
      request.offers.some((o) => o.userId === toUserId);

    if (!isParticipant || !isTargetParticipant) {
      throw new HttpError(400, "Вы можете оценить только участника этой заявки");
    }

    if (fromUserId === toUserId) {
      throw new HttpError(400, "Нельзя оценить самого себя");
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        requestId_fromUserId: {
          requestId,
          fromUserId,
        },
      },
    });

    if (existingReview) {
      throw new HttpError(400, "Вы уже оставили отзыв на эту заявку");
    }

    const review = await prisma.review.create({
      data: {
        fromUserId,
        toUserId,
        requestId,
        rating,
        comment,
      },
    });

    const avgRating = await prisma.review.aggregate({
      where: { toUserId },
      _avg: { rating: true },
    });

    await prisma.user.update({
      where: { id: toUserId },
      data: { rating: avgRating._avg.rating || 0 },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "[CREATE_REVIEW_ERROR]");
  }
}
