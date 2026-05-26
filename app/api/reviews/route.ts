import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { isValidText } from "@/utils/badWords";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const limiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 10 });

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateKey = getRateLimitKey(req, "reviews");
    const { success, remaining, resetAt } = limiter.check(rateKey);
    
    if (!success) {
      return NextResponse.json(
        { error: "Слишком много запросов. Подождите немного." },
        { status: 429 }
      );
    }

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const fromUserId = payload.userId as string;

    const { toUserId, requestId, rating, comment } = await req.json();

    if (comment) {
      const commentValidation = isValidText(comment, "Комментарий отзыва");
      if (!commentValidation.valid) {
        return NextResponse.json({ error: commentValidation.error }, { status: 400 });
      }
    }

    function isBlockedAllowedRoute(path: string): boolean {
      // Свой профиль /profile — НЕ ДОСТУПЕН для забаненных
      if (path === '/profile') return false;
      // Чужие профили /profile/:id — доступны
      if (path.startsWith('/profile/')) return true;
      // API пользователей — доступно для чтения
      if (path.startsWith('/api/users/')) return true;
      // API отзывов — доступно для чтения
      if (path.startsWith('/api/reviews/')) return true;  // ← ДОБАВИТЬ
      // Заявки и отклики
      if (path.startsWith('/requests/')) return true;
      if (path.startsWith('/offers/')) return true;
      // API для чтения
      if (path.startsWith('/api/feed')) return true;
      if (path.startsWith('/api/requests')) return true;
      if (path.startsWith('/api/offers')) return true;
      if (path.startsWith('/api/user/check-blocked')) return true;
      if (path.startsWith('/api/auth/validate')) return true;
      // Основные страницы
      if (path === '/') return true;
      if (path === '/feed') return true;
      if (path === '/blocked') return true;
      if (path === '/terms') return true;
      if (path === '/how-it-works') return true;
      return false;
    }

    if (!toUserId || !requestId || !rating) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Оценка должна быть от 1 до 5" },
        { status: 400 }
      );
    }

    // Проверяем, что заявка завершена и пользователь участвовал в ней
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
      return NextResponse.json(
        { error: "Можно оставить отзыв только на завершённую заявку" },
        { status: 400 }
      );
    }

    const isParticipant = request.authorId === fromUserId || 
                          request.offers.some(o => o.userId === fromUserId);
    const isTargetParticipant = request.authorId === toUserId || 
                                request.offers.some(o => o.userId === toUserId);

    if (!isParticipant || !isTargetParticipant) {
      return NextResponse.json(
        { error: "Вы можете оценить только участника этой заявки" },
        { status: 400 }
      );
    }

    if (fromUserId === toUserId) {
      return NextResponse.json(
        { error: "Нельзя оценить самого себя" },
        { status: 400 }
      );
    }

    // Проверяем, не оставлял ли уже отзыв
    const existingReview = await prisma.review.findUnique({
      where: {
        requestId_fromUserId: {
          requestId,
          fromUserId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Вы уже оставили отзыв на эту заявку" },
        { status: 400 }
      );
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

    // Обновляем рейтинг пользователя
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
    console.error("[CREATE_REVIEW_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}