import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req, { allowBlocked: true });
    const userId = user.id;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { fromUserId: userId },
        include: {
          toUser: {
            select: { id: true, name: true, avatar: true },
          },
          request: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { fromUserId: userId } }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleRouteError(error, "[MY_REVIEWS_ERROR]");
  }
}