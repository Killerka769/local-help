import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminLog } from "@/lib/adminLog";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id: userId, offerId } = await params;

    const offer = await prisma.offer.findUnique({
      where: { id: offerId, userId },
      select: { comment: true, request: { select: { title: true } } },
    });

    if (!offer) {
      return NextResponse.json({ error: "Отклик не найден" }, { status: 404 });
    }

    await prisma.offer.delete({ where: { id: offerId } });

    await createAdminLog({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: "delete_offer",
      targetType: "offer",
      targetId: offerId,
      targetName: offer.comment?.slice(0, 50),
      details: `Удалён отклик пользователя ${userId} на заявку "${offer.request.title}"`,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_DELETE_USER_OFFER_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}