import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(
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

    const userBlock = await prisma.user.findUnique({
      where: { id: userId },
      select: { isBlocked: true, role: true },
    });
    
    if (userBlock?.isBlocked) {
      return NextResponse.json(
        { error: 'Ваш аккаунт заблокирован' },
        { status: 403 }
      );
    }

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { request: true },
    });

    if (!offer) {
      return NextResponse.json({ error: "Отклик не найден" }, { status: 404 });
    }

    if (offer.request.authorId !== userId) {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

    if (offer.request.status !== "active") {
      return NextResponse.json(
        { error: "Заявка уже закрыта" },
        { status: 400 }
      );
    }

    if (offer.status !== "completed_by_executor") {
      return NextResponse.json(
        { error: "Исполнитель ещё не подтвердил выполнение" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.request.update({
        where: { id: offer.requestId },
        data: { status: "closed" },
      }),
      prisma.offer.update({
        where: { id },
        data: { status: "completed" },
      }),
    ]);

    await createNotification({
        userId: offer.userId,
        type: "request_completed",
        title: "Заявка завершена",
        message: `Заказчик подтвердил выполнение работы по заявке "${offer.request.title}". Спасибо!`,
        link: `/offers/${offer.id}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FINALIZE_REQUEST_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}