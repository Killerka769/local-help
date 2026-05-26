import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminLog } from "@/lib/adminLog";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;

    // Получаем информацию о заявке для лога
    const request = await prisma.request.findUnique({
      where: { id },
      select: { title: true },
    });

    await prisma.$transaction([
      prisma.offer.deleteMany({ where: { requestId: id } }),
      prisma.favorite.deleteMany({ where: { requestId: id } }),
      prisma.request.delete({ where: { id } }),
    ]);

    await createAdminLog({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: "delete_request",
      targetType: "request",
      targetId: id,
      targetName: request?.title || "Неизвестно",
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_DELETE_REQUEST_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}