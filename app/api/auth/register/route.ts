import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { isValidName } from "@/utils/badWords";
import { isValidPhone } from "@/utils/phoneValidation";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { validatePassword } from "@/lib/password";

const limiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 3 });

export async function POST(req: NextRequest) {
  try {
    const rateKey = getRateLimitKey(req, "register");
    const { success } = limiter.check(rateKey);

    if (!success) {
      return NextResponse.json(
        { error: "Слишком много запросов. Подождите немного." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, phone, password, cityId, termsAccepted, privacyAccepted, ageAccepted } = body;

    if (!name || !phone || !password || !cityId) {
      return NextResponse.json(
        { error: "Заполните все поля" },
        { status: 400 }
      );
    }

    if (termsAccepted !== true || privacyAccepted !== true || ageAccepted !== true) {
      return NextResponse.json(
        { error: "Нужно принять соглашение, политику конфиденциальности и подтвердить, что вам есть 18 лет" },
        { status: 400 }
      );
    }

    const nameValidation = isValidName(name);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const phoneValidation = isValidPhone(phone);
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { error: phoneValidation.error },
        { status: 400 }
      );
    }

    const normalizedPhone = phone.replace(/\D/g, "");
    const finalPhone = normalizedPhone.startsWith("8")
      ? `7${normalizedPhone.slice(1)}`
      : normalizedPhone;

    const cityExists = await prisma.city.findUnique({
      where: { id: cityId },
    });

    if (!cityExists) {
      return NextResponse.json(
        { error: "Выбранный город не существует" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { phone: finalPhone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким номером уже существует" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const acceptedAt = new Date();

    const user = await prisma.user.create({
      data: {
        name,
        phone: finalPhone,
        passwordHash,
        cityId,
        role: "USER",
        termsAcceptedAt: acceptedAt,
        privacyAcceptedAt: acceptedAt,
        ageConfirmedAt: acceptedAt,
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
