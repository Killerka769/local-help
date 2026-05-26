import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

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

    // Получаем текущего пользователя из токена (если есть)
    let currentUserId: string | null = null;
    let hasUserReviewed = false;
    const token = req.cookies.get("token")?.value;
    
    if (token) {
      try {
        const { payload } = await jwtVerify(token, secret);
        currentUserId = payload.userId as string;
        
        // Проверяем, оставлял ли пользователь отзыв на эту заявку
        const existingReview = await prisma.review.findUnique({
          where: {
            requestId_fromUserId: {
              requestId: id,
              fromUserId: currentUserId,
            },
          },
        });
        hasUserReviewed = !!existingReview;
      } catch {
        // Токен невалидный — игнорируем
      }
    }

    // Если текущий пользователь — автор, показываем телефоны откликнувшихся
    // Если нет — скрываем контакты
    const isAuthor = currentUserId === request.authorId;
    const isOfferUser = request.offers.some((offer) => offer.userId === currentUserId);

    // Формируем ответ с учётом прав
    const responseData = {
      ...request,
      author: {
        ...request.author,
        phone: isAuthor ? request.author.phone : undefined,
      },
      offers: request.offers.map((offer) => ({
        ...offer,
        user: {
          ...offer.user,
          phone: isAuthor || isOfferUser ? offer.user.phone : undefined,
        },
        canApprove: isAuthor && offer.status === "pending",
      })),
      canOffer: !isAuthor && currentUserId !== null,
      isAuthor,
      hasUserReviewed, // ← добавляем проверку на отзыв
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[GET_REQUEST_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// PUT — обновление заявки (только автор)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const body = await req.json();
    const { title, description, address, budget, deadline } = body;

    // Проверяем, существует ли заявка и принадлежит ли она пользователю
    const existingRequest = await prisma.request.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    if (existingRequest.authorId !== userId) {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

    if (existingRequest.status !== "active") {
      return NextResponse.json(
        { error: "Нельзя редактировать закрытую заявку" },
        { status: 400 }
      );
    }

    // Валидация
    if (title && title.length < 5) {
      return NextResponse.json(
        { error: "Заголовок должен быть минимум 5 символов" },
        { status: 400 }
      );
    }

    if (description && description.length < 20) {
      return NextResponse.json(
        { error: "Описание должно быть минимум 20 символов" },
        { status: 400 }
      );
    }

    if (address && address.length < 5) {
      return NextResponse.json(
        { error: "Адрес должен быть минимум 5 символов" },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.request.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        address: address !== undefined ? address : undefined,
        budget: budget !== undefined ? (budget ? parseInt(budget) : null) : undefined,
        deadline: deadline !== undefined ? parseInt(deadline) : undefined,
      },
    });

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error("[UPDATE_REQUEST_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// DELETE — удаление заявки (только автор)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const existingRequest = await prisma.request.findUnique({
      where: { id },
      include: {
        offers: true,
      },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    if (existingRequest.authorId !== userId) {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

    // Удаляем связанные отклики, затем заявку
    await prisma.$transaction([
      prisma.offer.deleteMany({
        where: { requestId: id },
      }),
      prisma.request.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE_REQUEST_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}