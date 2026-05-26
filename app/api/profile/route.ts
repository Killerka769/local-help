import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { isValidName, isValidText } from "@/utils/badWords";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const limiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 10 });

// GET — получить профиль
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    // Получаем пользователя с основными данными
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        avatar: true,
        description: true,
        cityId: true,
        role: true,
        isBlocked: true,
        rating: true,
        email: true,         
        emailVerified: true,  
        createdAt: true,
        _count: {
          select: {
            requests: true,
            offers: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Считаем количество выполненных заявок (где пользователь был исполнителем и отклик завершён)
    const completedCount = await prisma.offer.count({
      where: {
        userId: userId,
        status: "completed",
      },
    });

    return NextResponse.json({
      user: {
        ...user,
        completedCount,
      },
    });
  } catch (error) {
    console.error("[PROFILE_GET_ERROR]", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// PUT — обновить профиль
export async function PUT(req: NextRequest) {
  try {
    const rateKey = getRateLimitKey(req, "profileUpdate");
    const { success } = limiter.check(rateKey);

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

    const body = await req.json();
    const { name, description, avatar, cityId } = body;

    // Проверяем, существует ли город (если передан)
    if (cityId) {
      const cityExists = await prisma.city.findUnique({
        where: { id: cityId },
      });
      if (!cityExists) {
        return NextResponse.json({ error: "Город не найден" }, { status: 400 });
      }
    }

    if (name !== undefined) {
      const nameValidation = isValidName(name);
      if (!nameValidation.valid) {
        return NextResponse.json({ error: nameValidation.error }, { status: 400 });
      }
    }

    if (description !== undefined) {
      const descValidation = isValidText(description, "Описание");
      if (!descValidation.valid) {
        return NextResponse.json({ error: descValidation.error }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
        cityId: cityId !== undefined ? cityId : undefined,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        avatar: true,
        description: true,
        cityId: true,
        createdAt: true,
        rating: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("[PROFILE_PUT_ERROR]", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}