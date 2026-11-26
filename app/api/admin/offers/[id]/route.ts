import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminLog } from "@/lib/adminLog";
import { requireAdmin } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await requireAdmin(req);

    // Получаем информацию об отклике для лога
    const offer = await prisma.offer.findUnique({
      where: { id },
      select: { comment: true, request: { select: { title: true } } },
    });

    await prisma.offer.delete({
      where: { id },
    });

    await createAdminLog({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: "delete_offer",
      targetType: "offer",
      targetId: id,
      targetName: offer?.comment?.slice(0, 100) || "Неизвестно",
      details: `Заявка: ${offer?.request?.title || "Неизвестно"}`,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "[ADMIN_DELETE_OFFER_ERROR]");
  }
}