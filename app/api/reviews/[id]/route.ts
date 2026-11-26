import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";
import { isValidText } from "@/utils/badWords";

// PUT — редактирование отзыва (только автор)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireUser(req);
    const userId = authUser.id;

    const { rating, comment } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Оценка должна быть от 1 до 5" },
        { status: 400 }
      );
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 });
    }

    if (review.fromUserId !== userId) {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

    if (comment) {
      const check = isValidText(comment, "Комментарий отзыва");
      if (!check.valid) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        rating,
        comment: comment || null,
      },
    });

    // Обновляем рейтинг пользователя
    const avgRating = await prisma.review.aggregate({
      where: { toUserId: review.toUserId },
      _avg: { rating: true },
    });

    await prisma.user.update({
      where: { id: review.toUserId },
      data: { rating: avgRating._avg.rating || 0 },
    });

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    return handleRouteError(error, "[UPDATE_REVIEW_ERROR]");
  }
}

// DELETE — удаление отзыва (только SUPER_ADMIN)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSuperAdmin(req);

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 });
    }

    await prisma.review.delete({
      where: { id },
    });

    // Обновляем рейтинг пользователя
    const avgRating = await prisma.review.aggregate({
      where: { toUserId: review.toUserId },
      _avg: { rating: true },
    });

    await prisma.user.update({
      where: { id: review.toUserId },
      data: { rating: avgRating._avg.rating || 0 },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "[DELETE_REVIEW_ERROR]");
  }
}