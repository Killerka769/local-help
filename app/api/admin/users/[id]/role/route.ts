import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminLog } from "@/lib/adminLog";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin(req);
    const { id } = await params;
    const { role } = await req.json();

    if (!["USER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Неверная роль" }, { status: 400 });
    }

    if(role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Роль SUPER_ADMIN нельзя назначить через интерфейс" },
        { status: 403 }
      );
    }

    if (admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Только SUPER_ADMIN может менять роли' }, { status: 403 });
    }

    // Получаем старого пользователя для лога
    const oldUser = await prisma.user.findUnique({
      where: { id },
      select: { name: true, role: true },
    });

    if (!oldUser) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
      },
    });

    await createAdminLog({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: "change_role",
      targetType: "user",
      targetId: id,
      targetName: oldUser.name,
      details: `Роль изменена с ${oldUser.role} на ${role}`,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[SET_ROLE_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}