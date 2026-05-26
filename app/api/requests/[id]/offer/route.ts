import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { isValidText } from "@/utils/badWords";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { checkDailyLimit, incrementDailyLimit } from "@/lib/dailyLimits";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const limiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 20 });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const rateKey = getRateLimitKey(req, "requests-id-offer");
    const { success, remaining, resetAt } = limiter.check(rateKey);
        
    if (!success) {
      return NextResponse.json(
        { error: "Слишком много запросов. Подождите немного." },
        { status: 429 }
      );
    }
    const { id } = await params;
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const limitCheck = await checkDailyLimit(userId, "offer");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Вы превысили лимит на отклики. Можно откликнуться не более ${limitCheck.limit} раз в день.` },
        { status: 429 }
      );
    }

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

    // Получаем данные пользователя для уведомления
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const { comment } = await req.json();

    const commentValidation = isValidText(comment, "Комментарий");
    if (!commentValidation.valid) {
      return NextResponse.json({ error: commentValidation.error }, { status: 400 });
    }

    if (!comment || comment.trim().length < 5) {
      return NextResponse.json(
        { error: "Комментарий должен быть минимум 5 символов" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли заявка и активна ли она
    const request = await prisma.request.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    if (request.status !== "active") {
      return NextResponse.json(
        { error: "Заявка уже закрыта или истёк срок" },
        { status: 400 }
      );
    }

    if (request.authorId === userId) {
      return NextResponse.json(
        { error: "Нельзя откликнуться на свою заявку" },
        { status: 400 }
      );
    }

    // Проверяем, не откликался ли уже
    const existingOffer = await prisma.offer.findUnique({
      where: {
        requestId_userId: {
          requestId: id,
          userId,
        },
      },
    });

    if (existingOffer) {
      return NextResponse.json(
        { error: "Вы уже откликнулись на эту заявку" },
        { status: 400 }
      );
    }

    const offer = await prisma.offer.create({
      data: {
        comment,
        requestId: id,
        userId,
        status: "pending",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
          },
        },
      },
    });

    await incrementDailyLimit(userId, "offer");

    // Уведомление автору заявки
    await createNotification({
      userId: request.authorId,
      type: "new_offer",
      title: "Новый отклик",
      message: `${user?.name || "Пользователь"} откликнулся на вашу заявку "${request.title}"`,
      link: `/requests/${request.id}`,
    });

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error("[CREATE_OFFER_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}