import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";

const limiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 20 });

// POST — добавить в избранное
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateKey = getRateLimitKey(req, "favorites");
    const { success, remaining, resetAt } = limiter.check(rateKey);
    
    if (!success) {
      return NextResponse.json(
        { error: "Слишком много запросов. Подождите немного." },
        { status: 429 }
      );
    }
    
    const authUser = await requireUser(req);
    const userId = authUser.id;

    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: "ID заявки обязателен" }, { status: 400 });
    }

    // Проверяем, существует ли заявка
    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    // Нельзя добавить свою заявку
    if (request.authorId === userId) {
      return NextResponse.json(
        { error: "Нельзя добавить в избранное свою заявку" },
        { status: 400 }
      );
    }

    // Добавляем
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        requestId,
      },
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "[ADD_FAVORITE_ERROR]");
  }
}

// DELETE — удалить из избранного
export async function DELETE(req: NextRequest) {
  try {
    // Rate limiting
    const rateKey = getRateLimitKey(req, "favorites");
    const { success, remaining, resetAt } = limiter.check(rateKey);
    
    if (!success) {
      return NextResponse.json(
        { error: "Слишком много запросов. Подождите немного." },
        { status: 429 }
      );
    }

    const authUser = await requireUser(req, { allowBlocked: true });
    const userId = authUser.id;

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json({ error: "ID заявки обязателен" }, { status: 400 });
    }

    await prisma.favorite.delete({
      where: {
        userId_requestId: {
          userId,
          requestId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "[REMOVE_FAVORITE_ERROR]");
  }
}