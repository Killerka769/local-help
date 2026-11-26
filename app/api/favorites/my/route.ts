import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        requestId: true,
        createdAt: true,
        request: {
          select: {
            id: true,
            title: true,
            description: true,
            address: true,
            budget: true,
            deadline: true,
            status: true,
            createdAt: true,
            city: { select: { name: true } },
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      favorites: favorites.map((fav) => {
        const { address, ...request } = fav.request;
        return { ...fav, request: { ...request, district: address } };
      }),
    });
  } catch (error) {
    return handleRouteError(error, "[GET_FAVORITES_ERROR]");
  }
}
