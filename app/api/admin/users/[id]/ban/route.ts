import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminLog } from "@/lib/adminLog";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;
    const { reason, days } = await req.json();

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { name: true, role: true, isBlocked: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Нельзя заблокировать главного администратора" },
        { status: 403 }
      );
    }

    if (targetUser.role === "ADMIN" && admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Недостаточно прав для блокировки администратора" },
        { status: 403 }
      );
    }

    const blockedUntil = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isBlocked: true,
        blockedBy: admin.id,
        blockedReason: reason || "Нарушение правил",
        blockedUntil,
        bannedAt: new Date(),
      },
    });

    await createAdminLog({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: "ban_user",
      targetType: "user",
      targetId: id,
      targetName: targetUser.name,
      details: `Причина: ${reason || "не указана"}, срок: ${days ? days + " дней" : "бессрочно"}`,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("[BAN_USER_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isBlocked: false,
        blockedBy: null,
        blockedReason: null,
        blockedUntil: null,
        bannedAt: null,
      },
    });

    await createAdminLog({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: "unban_user",
      targetType: "user",
      targetId: id,
      targetName: targetUser.name,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[UNBAN_USER_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}