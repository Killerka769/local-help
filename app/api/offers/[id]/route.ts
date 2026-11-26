import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalUser, requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";
import { isContactStatus } from "@/lib/contacts";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
            description: true,
          },
        },
        request: {
          include: {
            city: { select: { id: true, name: true } },
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Отклик не найден" }, { status: 404 });
    }

    const currentUser = await getOptionalUser(req);
    const currentUserId = currentUser?.id ?? null;
    const isAuthor = currentUserId === offer.request.authorId;
    const isOfferUser = currentUserId === offer.userId;
    const canViewContacts =
      isContactStatus(offer.status) && (isAuthor || isOfferUser);

    return NextResponse.json({
      id: offer.id,
      comment: offer.comment,
      status: offer.status,
      requestId: offer.requestId,
      userId: offer.userId,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
      user: {
        id: offer.user.id,
        name: offer.user.name,
        avatar: offer.user.avatar,
        description: offer.user.description,
        phone: canViewContacts ? offer.user.phone : null,
      },
      request: {
        id: offer.request.id,
        title: offer.request.title,
        description: offer.request.description,
        budget: offer.request.budget,
        deadline: offer.request.deadline,
        status: offer.request.status,
        createdAt: offer.request.createdAt,
        city: offer.request.city,
        district: offer.request.address,
        author: {
          id: offer.request.author.id,
          name: offer.request.author.name,
          avatar: offer.request.author.avatar,
          phone: canViewContacts ? offer.request.author.phone : null,
        },
      },
      canApprove: isAuthor && offer.status === "pending" && offer.request.status === "active",
      canViewPhone: canViewContacts,
    });
  } catch (error) {
    return handleRouteError(error, "[GET_OFFER_ERROR]");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser(req);

    const offer = await prisma.offer.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!offer) {
      throw new HttpError(404, "Отклик не найден");
    }

    if (offer.userId !== user.id) {
      throw new HttpError(403, "Нет прав");
    }

    if (offer.status === "approved") {
      throw new HttpError(400, "Нельзя удалить одобренный отклик");
    }

    await prisma.offer.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "[DELETE_OFFER_ERROR]");
  }
}
