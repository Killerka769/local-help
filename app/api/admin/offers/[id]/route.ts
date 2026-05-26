import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { createAdminLog } from "@/lib/adminLog";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

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

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });

    if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

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
    console.error("[ADMIN_DELETE_OFFER_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}