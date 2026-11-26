import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidText } from "@/utils/badWords";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { checkDailyLimit, incrementDailyLimit } from "@/lib/dailyLimits";
import { requireUser, getOptionalUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";
import { computeExpiresAt } from "@/lib/requestExpiry";
import { districtError, readDistrict } from "@/lib/district";

const limiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 10 });

const PUBLIC_SELECT = {
  id: true,
  title: true,
  description: true,
  address: true,
  budget: true,
  deadline: true,
  status: true,
  createdAt: true,
  cityId: true,
  author: {
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  },
  city: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

function toPublicRequest<T extends { address: string }>(row: T) {
  const { address, ...rest } = row;
  return { ...rest, district: address };
}

export async function POST(req: NextRequest) {
  try {
    const { success } = limiter.check(getRateLimitKey(req, "requests"));
    if (!success) {
      return NextResponse.json(
        { error: "Слишком много запросов. Подождите немного." },
        { status: 429 }
      );
    }

    const user = await requireUser(req);

    const limitCheck = await checkDailyLimit(user.id, "request");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Вы превысили лимит на создание заявок. Можно создать не более ${limitCheck.limit} в день.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { title, description, budget, deadline } = body;
    const district = readDistrict(body);

    if (!title || !description || !district) {
      return NextResponse.json(
        { error: "Заполните заголовок, описание и район" },
        { status: 400 }
      );
    }

    if (title.length < 5 || title.length > 40) {
      return NextResponse.json(
        { error: "Заголовок: от 5 до 40 символов" },
        { status: 400 }
      );
    }

    if (description.length < 60 || description.length > 1500) {
      return NextResponse.json(
        { error: "Описание: от 60 до 1500 символов" },
        { status: 400 }
      );
    }

    const districtLengthError = districtError(district);
    if (districtLengthError) {
      return NextResponse.json({ error: districtLengthError }, { status: 400 });
    }

    if (!deadline || ![3, 7, 30].includes(deadline)) {
      return NextResponse.json(
        { error: "Выберите срок: 3, 7 или 30 дней" },
        { status: 400 }
      );
    }

    if (!user.cityId) {
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

    const districtValidation = isValidText(district, "Район");
    if (!districtValidation.valid) {
      return NextResponse.json({ error: districtValidation.error }, { status: 400 });
    }

    const now = new Date();
    const request = await prisma.request.create({
      data: {
        title,
        description,
        address: district,
        budget: budget ? parseInt(budget) : null,
        deadline,
        expiresAt: computeExpiresAt(now, deadline),
        cityId: user.cityId,
        authorId: user.id,
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

    await incrementDailyLimit(user.id, "request");

    return NextResponse.json({ request: toPublicRequest(request) }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "[CREATE_REQUEST_ERROR]");
  }
}

export async function GET(req: NextRequest) {
  try {
    await getOptionalUser(req);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const skip = (page - 1) * limit;

    const where = {
      status: "active" as const,
      expiresAt: { gt: new Date() },
    };

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        select: PUBLIC_SELECT,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.request.count({ where }),
    ]);

    return NextResponse.json({
      requests: requests.map(toPublicRequest),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleRouteError(error, "[GET_REQUESTS_ERROR]");
  }
}
