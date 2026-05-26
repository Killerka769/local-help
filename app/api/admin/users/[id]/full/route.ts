import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { id },
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
        bannedAt: true,
        rating: true,
        createdAt: true,
        city: {
          select: { name: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Кто заблокировал
    let blockedByName = null;
    if (user.blockedBy) {
      const blocker = await prisma.user.findUnique({
        where: { id: user.blockedBy },
        select: { name: true },
      });
      blockedByName = blocker?.name;
    }

    // Заявки пользователя
    const requests = await prisma.request.findMany({
      where: { authorId: id },
      include: {
        author: {
          select: { name: true, phone: true },
        },
        city: {
          select: { name: true },
        },
        offers: {
          include: {
            user: {
              select: { name: true, phone: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Отклики пользователя
    const offers = await prisma.offer.findMany({
      where: { userId: id },
      include: {
        request: {
          select: {
            id: true,
            title: true,
            status: true,
            author: {
              select: { name: true, phone: true },
            },
          },
        },
        user: {
          select: { name: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Выполненные заявки (где пользователь был исполнителем и заявка закрыта)
    const completedRequests = await prisma.request.findMany({
      where: {
        status: "closed",
        offers: {
          some: {
            userId: id,
            status: "completed",
          },
        },
      },
      include: {
        author: {
          select: { name: true, phone: true },
        },
        offers: {
          where: {
            userId: id,
            status: "completed",
          },
          include: {
            user: {
              select: { name: true, phone: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Статистика
    const stats = {
      totalRequests: requests.length,
      activeRequests: requests.filter(r => r.status === "active").length,
      closedRequests: requests.filter(r => r.status === "closed").length,
      totalOffers: offers.length,
      pendingOffers: offers.filter(o => o.status === "pending").length,
      approvedOffers: offers.filter(o => o.status === "approved").length,
      completedOffers: offers.filter(o => o.status === "completed").length,
      rejectedOffers: offers.filter(o => o.status === "rejected").length,
    };

    // Жалобы на пользователя
    const complaints = await prisma.complaint.findMany({
      where: {
        targetType: "user",
        targetId: id,
      },
      include: {
        user: {
          select: { name: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Жалобы от пользователя
    const userComplaints = await prisma.complaint.findMany({
      where: { userId: id },
      include: {
        user: {
          select: { name: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      user: {
        ...user,
        cityName: user.city?.name,
        blockedByName,
      },
      requests,
      offers,
      completedRequests,
      stats,
      complaints,
      userComplaints,
    });
  } catch (error) {
    console.error("[ADMIN_USER_FULL_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}