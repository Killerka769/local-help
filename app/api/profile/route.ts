import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidName, isValidText } from "@/utils/badWords";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";
import { sanitizeAvatarUrl } from "@/lib/avatar";

const limiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 10 });

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireUser(req, { allowBlocked: true });

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        phone: true,
        avatar: true,
        description: true,
        cityId: true,
        role: true,
        isBlocked: true,
        blockedReason: true,
        blockedUntil: true,
        blockedBy: true,
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
      throw new HttpError(404, "Пользователь не найден");
    }

    const completedCount = await prisma.offer.count({
      where: {
        userId: authUser.id,
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
    return handleRouteError(error, "[PROFILE_GET_ERROR]");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { success } = limiter.check(getRateLimitKey(req, "profileUpdate"));
    if (!success) {
      throw new HttpError(429, "Слишком много запросов. Подождите немного.");
    }

    const authUser = await requireUser(req);
    const body = await req.json();
    const { name, description, avatar, cityId } = body;

    if (cityId) {
      const cityExists = await prisma.city.findUnique({
        where: { id: cityId },
      });
      if (!cityExists) {
        throw new HttpError(400, "Город не найден");
      }
    }

    if (name !== undefined) {
      const nameValidation = isValidName(name);
      if (!nameValidation.valid) {
        throw new HttpError(400, nameValidation.error || "Неверное имя");
      }
    }

    if (description !== undefined) {
      const descValidation = isValidText(description, "Описание");
      if (!descValidation.valid) {
        throw new HttpError(400, descValidation.error || "Неверное описание");
      }
    }

    let avatarValue: string | null | undefined = undefined;
    if (avatar !== undefined) {
      try {
        avatarValue = sanitizeAvatarUrl(avatar);
      } catch (e) {
        throw new HttpError(400, e instanceof Error ? e.message : "Неверный URL аватара");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        avatar: avatarValue !== undefined ? avatarValue : undefined,
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
    return handleRouteError(error, "[PROFILE_PUT_ERROR]");
  }
}
