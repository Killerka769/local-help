import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
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
    
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const userBlock = await prisma.user.findUnique({
        where: { id: userId },
        select: { isBlocked: true, role: true },
      });
      
      if (userBlock?.isBlocked) {
        return NextResponse.json(
          { error: 'Ваш аккаунт заблокирован' },
          { status: 403 }
        );
      }

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
    console.error("[ADD_FAVORITE_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
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

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

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
    console.error("[REMOVE_FAVORITE_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}