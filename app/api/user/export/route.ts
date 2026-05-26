import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        avatar: true,
        description: true,
        createdAt: true,
        role: true,
        isBlocked: true,
        rating: true,
        city: { select: { name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Заявки пользователя
    const requests = await prisma.request.findMany({
      where: { authorId: userId },
      include: {
        city: { select: { name: true } },
        offers: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Отклики пользователя
    const offers = await prisma.offer.findMany({
      where: { userId },
      include: {
        request: { select: { id: true, title: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Отзывы, которые написал пользователь
    const reviewsGiven = await prisma.review.findMany({
      where: { fromUserId: userId },
      include: {
        toUser: { select: { name: true } },
        request: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Отзывы, которые получил пользователь
    const reviewsReceived = await prisma.review.findMany({
      where: { toUserId: userId },
      include: {
        fromUser: { select: { name: true } },
        request: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Избранное
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        request: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Жалобы, которые отправил пользователь
    const complaintsSent = await prisma.complaint.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Формируем JSON для экспорта
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        city: user.city?.name,
        description: user.description,
        rating: user.rating,
        registeredAt: user.createdAt,
        role: user.role,
        isBlocked: user.isBlocked,
      },
      stats: {
        totalRequests: requests.length,
        totalOffers: offers.length,
        totalReviewsGiven: reviewsGiven.length,
        totalReviewsReceived: reviewsReceived.length,
        totalFavorites: favorites.length,
        totalComplaintsSent: complaintsSent.length,
      },
      requests: requests.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        address: r.address,
        budget: r.budget,
        deadline: r.deadline,
        status: r.status,
        city: r.city?.name,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        offersCount: r.offers.length,
        offers: r.offers.map(o => ({
          comment: o.comment,
          status: o.status,
          userName: o.user.name,
          userPhone: o.user.phone,
          createdAt: o.createdAt,
        })),
      })),
      offers: offers.map(o => ({
        id: o.id,
        comment: o.comment,
        status: o.status,
        requestId: o.request.id,
        requestTitle: o.request.title,
        requestStatus: o.request.status,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
      reviewsGiven: reviewsGiven.map(r => ({
        rating: r.rating,
        comment: r.comment,
        toUser: r.toUser.name,
        requestTitle: r.request.title,
        createdAt: r.createdAt,
      })),
      reviewsReceived: reviewsReceived.map(r => ({
        rating: r.rating,
        comment: r.comment,
        fromUser: r.fromUser.name,
        requestTitle: r.request.title,
        createdAt: r.createdAt,
      })),
      favorites: favorites.map(f => ({
        requestId: f.request.id,
        requestTitle: f.request.title,
        addedAt: f.createdAt,
      })),
      complaintsSent: complaintsSent.map(c => ({
        targetType: c.targetType,
        targetId: c.targetId,
        reason: c.reason,
        description: c.description,
        status: c.status,
        createdAt: c.createdAt,
      })),
    };

    // Возвращаем JSON
    return NextResponse.json(exportData, {
      headers: {
        "Content-Disposition": `attachment; filename="localhelp-export-${userId.slice(0, 8)}.json"`,
      },
    });
  } catch (error) {
    console.error("[EXPORT_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}