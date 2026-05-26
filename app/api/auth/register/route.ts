import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { isValidName } from "@/utils/badWords";
import { isValidPhone } from "@/utils/phoneValidation";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

const limiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 3 });

export async function POST(req: NextRequest) {
  const SUPER_ADMIN_PHONE = process.env.SUPER_ADMIN_PHONE || "";
  try {
    // Rate limiting
    const rateKey = getRateLimitKey(req, "register");
    const { success } = limiter.check(rateKey);
    
    if (!success) {
      return NextResponse.json(
        { error: "Слишком много запросов. Подождите немного." },
        { status: 429 }
      );
    }
    
    const body = await req.json();
    const { name, phone, password, cityId } = body;

    // Валидация полей
    if (!name || !phone || !password || !cityId) {
      return NextResponse.json(
        { error: "Заполните все поля" },
        { status: 400 }
      );
    }

    // Валидация имени
    const nameValidation = isValidName(name);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      );
    }

    // Валидация пароля
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен быть минимум 6 символов" },
        { status: 400 }
      );
    }

    // Валидация телефона (новая)
    const phoneValidation = isValidPhone(phone);
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { error: phoneValidation.error },
        { status: 400 }
      );
    }

    // Нормализуем телефон для сохранения в БД (единый формат: 7XXXXXXXXXX)
    const normalizedPhone = phone.replace(/\D/g, "")
    const finalPhone = normalizedPhone.startsWith("8") 
      ? `7${normalizedPhone.slice(1)}` 
      : normalizedPhone

    // Проверяем, существует ли город
    const cityExists = await prisma.city.findUnique({
      where: { id: cityId },
    });

    if (!cityExists) {
      return NextResponse.json(
        { error: "Выбранный город не существует" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { phone: finalPhone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким номером уже существует" },
        { status: 409 }
      );
    }

    const role = finalPhone === SUPER_ADMIN_PHONE ? "SUPER_ADMIN" : "USER";

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Создаём пользователя
    const user = await prisma.user.create({
      data: {
        name,
        phone: finalPhone,
        passwordHash,
        cityId,
        role,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        cityId: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}