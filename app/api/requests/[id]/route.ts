import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalUser, requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";
import { isValidText } from "@/utils/badWords";
import {
  viewerCanSeeAuthorPhone,
  viewerCanSeeOfferPhone,
} from "@/lib/contacts";
import { districtError, readDistrict } from "@/lib/district";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
            description: true,
          },
        },
        city: {
          select: { id: true, name: true },
        },
        offers: {
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
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    const currentUser = await getOptionalUser(req);
    const currentUserId = currentUser?.id ?? null;

    let hasUserReviewed = false;
    if (currentUserId) {
      const existingReview = await prisma.review.findUnique({
        where: {
          requestId_fromUserId: {
            requestId: id,
            fromUserId: currentUserId,
          },
        },
      });
      hasUserReviewed = !!existingReview;
    }

    const isAuthor = currentUserId === request.authorId;
    const canViewAuthorPhone = viewerCanSeeAuthorPhone({
      viewerId: currentUserId,
      authorId: request.authorId,
      offers: request.offers,
    });

    const responseData = {
      id: request.id,
      title: request.title,
      description: request.description,
      budget: request.budget,
      deadline: request.deadline,
      status: request.status,
      authorId: request.authorId,
      cityId: request.cityId,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      city: request.city,
      district: request.address,
      author: {
        id: request.author.id,
        name: request.author.name,
        avatar: request.author.avatar,
        description: request.author.description,
        phone: canViewAuthorPhone ? request.author.phone : undefined,
      },
      offers: request.offers.map((offer) => ({
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
          phone: viewerCanSeeOfferPhone({
            viewerId: currentUserId,
            authorId: request.authorId,
            offerUserId: offer.userId,
            offerStatus: offer.status,
          })
            ? offer.user.phone
            : undefined,
        },
        canApprove: isAuthor && offer.status === "pending" && request.status === "active",
      })),
      canOffer: !isAuthor && currentUserId !== null,
      isAuthor,
      canViewPhone: canViewAuthorPhone,
      hasUserReviewed,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    return handleRouteError(error, "[GET_REQUEST_ERROR]");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser(req);
    const body = await req.json();
    const { title, description, budget, deadline } = body;
    const district = readDistrict(body);

    const existingRequest = await prisma.request.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      throw new HttpError(404, "Заявка не найдена");
    }

    if (existingRequest.authorId !== user.id) {
      throw new HttpError(403, "Нет прав");
    }

    if (existingRequest.status !== "active") {
      throw new HttpError(400, "Нельзя редактировать закрытую заявку");
    }

    if (title) {
      const check = isValidText(title, "Заголовок");
      if (!check.valid) throw new HttpError(400, check.error || "Неверный заголовок");
      if (title.length < 5 || title.length > 40) {
        throw new HttpError(400, "Заголовок: от 5 до 40 символов");
      }
    }

    if (description) {
      const check = isValidText(description, "Описание");
      if (!check.valid) throw new HttpError(400, check.error || "Неверное описание");
      if (description.length < 60 || description.length > 1500) {
        throw new HttpError(400, "Описание: от 60 до 1500 символов");
      }
    }

    if (district) {
      const check = isValidText(district, "Район");
      if (!check.valid) throw new HttpError(400, check.error || "Неверный район");
      const lengthError = districtError(district);
      if (lengthError) throw new HttpError(400, lengthError);
    }

    const updatedRequest = await prisma.request.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        address: district ? district : undefined,
        budget: budget !== undefined ? (budget ? parseInt(budget) : null) : undefined,
        deadline: deadline !== undefined ? parseInt(deadline) : undefined,
      },
    });

    const { address: savedDistrict, ...rest } = updatedRequest;
    return NextResponse.json({
      request: { ...rest, district: savedDistrict },
    });
  } catch (error) {
    return handleRouteError(error, "[UPDATE_REQUEST_ERROR]");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser(req);

    const existingRequest = await prisma.request.findUnique({
      where: { id },
      include: { offers: true },
    });

    if (!existingRequest) {
      throw new HttpError(404, "Заявка не найдена");
    }

    if (existingRequest.authorId !== user.id) {
      throw new HttpError(403, "Нет прав");
    }

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { requestId: id } }),
      prisma.offer.deleteMany({ where: { requestId: id } }),
      prisma.favorite.deleteMany({ where: { requestId: id } }),
      prisma.request.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "[DELETE_REQUEST_ERROR]");
  }
}
