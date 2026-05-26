import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { createAdminLog } from "@/lib/adminLog";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

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

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });

    if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

    const body = await req.json();
    const { status, action, targetId, banDays, banReason } = body;

    if (!status) {
      return NextResponse.json({ error: "Статус обязателен" }, { status: 400 });
    }

    // Получаем информацию о жалобе
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      select: { targetType: true, reason: true, targetId: true },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Жалоба не найдена" }, { status: 404 });
    }

    // Обновляем статус жалобы
    await prisma.complaint.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });

    // Если нужно удалить объект
    if (action === "delete" && targetId) {
      if (complaint.targetType === "request") {
        await prisma.request.update({
          where: { id: targetId },
          data: { status: "hidden" },
        });
      } else if (complaint.targetType === "offer") {
        await prisma.offer.update({
          where: { id: targetId },
          data: { status: "hidden" },
        });
      } else if (complaint.targetType === "user") {
        // Баним пользователя
        const blockedUntil = banDays ? new Date(Date.now() + banDays * 24 * 60 * 60 * 1000) : null;
        await prisma.user.update({
          where: { id: targetId },
          data: {
            isBlocked: true,
            blockedBy: admin.id,
            blockedReason: banReason || `Жалоба #${id}: ${complaint.reason}`,
            blockedUntil,
            bannedAt: new Date(),
          },
        });
      }
    }

    // Логируем действие
    let logAction = "resolve_complaint";
    if (status === "dismissed") logAction = "dismiss_complaint";
    if (action === "delete") logAction = "delete_complaint_target";

    await createAdminLog({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: logAction,
      targetType: "complaint",
      targetId: id,
      targetName: `Жалоба на ${complaint.targetType}`,
      details: `Причина: ${complaint.reason}. Новый статус: ${status}${action === "delete" ? ". Объект удалён." : ""}`,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_COMPLAINT_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}