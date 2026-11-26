import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";

const limiter = rateLimit({ windowMs: 60 * 60 * 1000, maxRequests: 3 });

export async function POST(req: NextRequest) {
  try {
    await requireUser(req);
    const { success } = limiter.check(getRateLimitKey(req, "advertising"));
    if (!success) {
      throw new HttpError(429, "Слишком много запросов. Подождите немного.");
    }

    const { name, email, company, message } = await req.json();

    if (!name || !email || !message) {
      throw new HttpError(400, "Заполните обязательные поля");
    }

    await prisma.advertisingRequest.create({
      data: {
        name: String(name).slice(0, 120),
        email: String(email).slice(0, 200),
        company: company ? String(company).slice(0, 200) : null,
        message: String(message).slice(0, 4000),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "[ADVERTISING_ERROR]");
  }
}
