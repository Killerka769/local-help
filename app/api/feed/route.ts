import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getOptionalUser } from "@/lib/auth";
import { expireOverdueRequests } from "@/lib/requestExpiry";

export async function GET(req: NextRequest) {
  try {
    await expireOverdueRequests();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const skip = (page - 1) * limit;

    const deadlineFilter = searchParams.get("deadline");
    const budgetMin = searchParams.get("budgetMin");
    const budgetMax = searchParams.get("budgetMax");
    const sortBy = searchParams.get("sortBy") || "date";
    const search = searchParams.get("search") || "";
    const cityFilter = searchParams.get("city");

    let userCityId: string | null = null;
    const currentUser = await getOptionalUser(req);
    if (currentUser) {
      userCityId = currentUser.cityId;
    }

    let targetCityId: string | null = null;
    if (cityFilter && cityFilter !== "all") {
      targetCityId = cityFilter;
    } else if (userCityId) {
      targetCityId = userCityId;
    }

    const where: Prisma.RequestWhereInput = {
      status: "active",
      expiresAt: { gt: new Date() },
      ...(targetCityId && { cityId: targetCityId }),
      ...(deadlineFilter && deadlineFilter !== "all" && { deadline: parseInt(deadlineFilter) }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    if (budgetMin || budgetMax) {
      where.budget = {};
      if (budgetMin) where.budget.gte = parseInt(budgetMin);
      if (budgetMax) where.budget.lte = parseInt(budgetMax);
    }

    let orderBy: Prisma.RequestOrderByWithRelationInput = { createdAt: "desc" };
    switch (sortBy) {
      case "budget_asc":
        orderBy = { budget: "asc" };
        break;
      case "budget_desc":
        orderBy = { budget: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        select: {
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
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.request.count({ where }),
    ]);

    return NextResponse.json({
      requests: requests.map(({ address, ...rest }) => ({
        ...rest,
        district: address,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      currentCityId: userCityId,
    });
  } catch (error) {
    console.error("[FEED_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
