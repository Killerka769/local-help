import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// PUT — редактирование отзыва (только автор)
export async function PUT(
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
    console.error("[UPDATE_REVIEW_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// DELETE — удаление отзыва (только SUPER_ADMIN)
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

    // Только SUPER_ADMIN может удалять отзывы
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (admin?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

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
    console.error("[DELETE_REVIEW_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}