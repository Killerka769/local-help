import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";
import { isContactStatus } from "@/lib/contacts";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req, { allowBlocked: true });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const skip = (page - 1) * limit;

    const where: { userId: string; status?: string } = { userId: user.id };
    if (status && status !== "all") {
      where.status = status;
    }

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: {
          request: {
            select: {
              id: true,
              title: true,
              address: true,
              budget: true,
              city: { select: { name: true } },
              author: {
                select: {
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.offer.count({ where }),
    ]);

    return NextResponse.json({
      offers: offers.map((offer) => {
        const share = isContactStatus(offer.status);
        return {
          ...offer,
          request: {
            id: offer.request.id,
            title: offer.request.title,
            budget: offer.request.budget,
            city: offer.request.city,
            district: offer.request.address,
            author: {
              phone: share ? offer.request.author.phone : null,
            },
          },
        };
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleRouteError(error, "[MY_OFFERS_ERROR]");
  }
}
