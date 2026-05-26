import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

const limiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 5 });

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateKey = getRateLimitKey(req, "login");
    const { success, remaining, resetAt } = limiter.check(rateKey);
    
    if (!success) {
      return NextResponse.json(
        { error: "Слишком много запросов. Подождите немного." },
        { status: 429 }
      );
    }

    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json(
        { error: "Введите номер телефона и пароль" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, phone: true, role: true, isBlocked: true, passwordHash : true, sessionVersion: true},
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь с таким номером не найден" },
        { status: 401 }
      );
    }

    // if (user?.isBlocked) {
    //   return NextResponse.json(
    //     { error: 'Ваш аккаунт заблокирован' },
    //     { status: 403 }
    //   );
    // }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Неверный пароль" },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const token = await new SignJWT({ 
      userId: user.id, 
      phone: user.phone, 
      role: user.role,
      sessionVersion: user.sessionVersion
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
        },
      },
      { status: 200 }
    );

    // Устанавливаем cookie с правильными параметрами
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: false, // Для разработки на localhost ставим false
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    });

    return response;
  } catch (error) {
    console.error("[LOGIN_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}