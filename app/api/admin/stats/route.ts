import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const [users, requests, offers, complaints, favorites] = await Promise.all([
      prisma.user.count(),
      prisma.request.count(),
      prisma.offer.count(),
      prisma.complaint.count(),
      prisma.favorite.count(),
    ]);

    const [activeRequests, activeUsersLastWeek] = await Promise.all([
      prisma.request.count({ where: { status: "active" } }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const requestsByStatus = await prisma.request.groupBy({
      by: ["status"],
      _count: true,
    });

    const complaintsByStatus = await prisma.complaint.groupBy({
      by: ["status"],
      _count: true,
    });

    return NextResponse.json({
      total: {
        users,
        requests,
        offers,
        complaints,
        favorites,
      },
      active: {
        requests: activeRequests,
        usersLastWeek: activeUsersLastWeek,
      },
      breakdown: {
        requests: requestsByStatus,
        complaints: complaintsByStatus,
      },
    });
  } catch (error) {
    console.error("[STATS_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}