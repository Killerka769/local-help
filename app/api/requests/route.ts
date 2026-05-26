import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { isValidText } from "@/utils/badWords";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { checkDailyLimit, incrementDailyLimit } from "@/lib/dailyLimits";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const limiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 10 });

// POST — создание заявки
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateKey = getRateLimitKey(req, "requests");
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

    // Проверка лимита
    const limitCheck = await checkDailyLimit(userId, "request");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Вы превысили лимит на создание заявок. Можно создать не более ${limitCheck.limit} в день.` },
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

    const body = await req.json();
    const { title, description, address, budget, deadline } = body;

    // Валидация
    if (!title || !description || !address) {
      return NextResponse.json(
        { error: "Заполните заголовок, описание и адрес" },
        { status: 400 }
      );
    }

    if (title.length < 5) {
      return NextResponse.json(
        { error: "Заголовок должен быть минимум 5 символов" },
        { status: 400 }
      );
    }

    if (description.length < 20) {
      return NextResponse.json(
        { error: "Описание должно быть минимум 20 символов" },
        { status: 400 }
      );
    }

    if (address.length < 5) {
      return NextResponse.json(
        { error: "Адрес должен быть минимум 5 символов" },
        { status: 400 }
      );
    }

    if (!deadline || ![3, 7, 30].includes(deadline)) {
      return NextResponse.json(
        { error: "Выберите срок: 3, 7 или 30 дней" },
        { status: 400 }
      );
    }

    // После получения title, description, address
    if (title.length > 40) {
      return NextResponse.json(
        { error: "Заголовок не должен превышать 40 символов" },
        { status: 400 }
      );
    }

    if (description.length > 1500) {
      return NextResponse.json(
        { error: "Описание не должно превышать 1500 символов" },
        { status: 400 }
      );
    }

    if (address.length > 30) {
      return NextResponse.json(
        { error: "Адрес не должен превышать 30 символов" },
        { status: 400 }
      );
    }

    // Проверка на слишком простой адрес (только цифры, дефисы)
    if (/^[0-9\s\-_]+$/.test(address)) {
      return NextResponse.json(
        { error: "Укажите реальный адрес, а не только цифры" },
        { status: 400 }
      );
    }

    // Получаем город пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cityId: true },
    });

    if (!user || !user.cityId) {
      return NextResponse.json(
        { error: "У вас не выбран город. Обновите профиль." },
        { status: 400 }
      );
    }

    const titleValidation = isValidText(title, "Заголовок");
    if (!titleValidation.valid) {
      return NextResponse.json({ error: titleValidation.error }, { status: 400 });
    }

    const descriptionValidation = isValidText(description, "Описание");
    if (!descriptionValidation.valid) {
      return NextResponse.json({ error: descriptionValidation.error }, { status: 400 });
    }

    // Создаём заявку — используем authorId напрямую
    const request = await prisma.request.create({
      data: {
        title,
        description,
        address,
        budget: budget ? parseInt(budget) : null,
        deadline,
        cityId: user.cityId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    await incrementDailyLimit(userId, "request");

    return NextResponse.json({ request }, { status: 201 });
  } catch (error) {
    console.error("[CREATE_REQUEST_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// GET — список заявок (активные, свежие сверху)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const requests = await prisma.request.findMany({
      where: {
        status: "active",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const total = await prisma.request.count({
      where: { status: "active" },
    });

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET_REQUESTS_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}