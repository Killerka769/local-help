import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { getJwtSecretBytes } from "@/lib/jwt";

const limiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 5 });
const INVALID = "Неверный телефон или пароль";

export async function POST(req: NextRequest) {
  try {
    const rateKey = getRateLimitKey(req, "login");
    const { success } = limiter.check(rateKey);

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

    const normalized = String(phone).replace(/\D/g, "");
    const finalPhone = normalized.startsWith("8")
      ? `7${normalized.slice(1)}`
      : normalized;

    const user = await prisma.user.findUnique({
      where: { phone: finalPhone },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        isBlocked: true,
        passwordHash: true,
        sessionVersion: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { error: "Ваш аккаунт заблокирован" },
        { status: 403 }
      );
    }

    const token = await new SignJWT({
      userId: user.id,
      role: user.role,
      sessionVersion: user.sessionVersion,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(getJwtSecretBytes());

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

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
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
