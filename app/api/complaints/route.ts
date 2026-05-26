import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { isValidText } from "@/utils/badWords";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const limiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 5 });

const REASON_OPTIONS = {
  request: [
    "Спам или реклама",
    "Оскорбления или грубость",
    "Мошенничество",
    "Нецензурная лексика",
    "Не по теме",
    "Другое",
  ],
  offer: [
    "Спам или реклама",
    "Оскорбления или грубость",
    "Мошенничество",
    "Нецензурная лексика",
    "Не по теме",
    "Другое",
  ],
  user: [
    "Спам или реклама",
    "Оскорбления или грубость",
    "Мошенничество",
    "Нецензурная лексика",
    "Неприемлемое поведение",
    "Фейковый аккаунт",
    "Другое",
  ],
};

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateKey = getRateLimitKey(req, "complaints");
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

    const { targetType, targetId, reason, description } = await req.json();

    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    if (description) {
      const descValidation = isValidText(description, "Описание жалобы");
      if (!descValidation.valid) {
        return NextResponse.json({ error: descValidation.error }, { status: 400 });
      }
    }

    if (!["request", "offer", "user"].includes(targetType)) {
      return NextResponse.json(
        { error: "Неверный тип цели" },
        { status: 400 }
      );
    }

    if (!REASON_OPTIONS[targetType as keyof typeof REASON_OPTIONS]?.includes(reason)) {
      return NextResponse.json(
        { error: "Неверная причина жалобы" },
        { status: 400 }
      );
    }

    // Проверка, что пользователь не жалуется на себя
    if (targetType === "request") {
      const request = await prisma.request.findUnique({
        where: { id: targetId },
        select: { authorId: true },
      });
      if (request?.authorId === userId) {
        return NextResponse.json(
          { error: "Нельзя пожаловаться на свою заявку" },
          { status: 400 }
        );
      }
    } else if (targetType === "offer") {
      const offer = await prisma.offer.findUnique({
        where: { id: targetId },
        select: { userId: true },
      });
      if (offer?.userId === userId) {
        return NextResponse.json(
          { error: "Нельзя пожаловаться на свой отклик" },
          { status: 400 }
        );
      }
    } else if (targetType === "user") {
      if (targetId === userId) {
        return NextResponse.json(
          { error: "Нельзя пожаловаться на себя" },
          { status: 400 }
        );
      }
    }

    // Проверяем, не жаловался ли уже пользователь на этот объект
    const existingComplaint = await prisma.complaint.findFirst({
      where: {
        userId,
        targetType,
        targetId,
        status: { in: ["pending", "reviewed"] },
      },
    });

    if (existingComplaint) {
      return NextResponse.json(
        { error: "Вы уже жаловались на этот объект" },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaint.create({
      data: {
        userId,
        targetType,
        targetId,
        reason,
        description,
        status: "pending",
      },
    });

    return NextResponse.json({ complaint }, { status: 201 });
  } catch (error) {
    console.error("[COMPLAINT_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}