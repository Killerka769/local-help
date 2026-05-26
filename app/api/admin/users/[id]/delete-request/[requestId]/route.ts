import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminLog } from "@/lib/adminLog";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; requestId: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { userId, requestId } = await params;

    const request = await prisma.request.findUnique({
      where: { id: requestId, authorId: userId },
      select: { title: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.offer.deleteMany({ where: { requestId } }),
      prisma.favorite.deleteMany({ where: { requestId } }),
      prisma.request.delete({ where: { id: requestId } }),
    ]);

    await createAdminLog({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: "delete_request",
      targetType: "request",
      targetId: requestId,
      targetName: request.title,
      details: `Удалена заявка пользователя ${userId}`,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_DELETE_USER_REQUEST_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}