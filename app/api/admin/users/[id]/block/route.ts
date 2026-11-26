import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/http";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;
    const { isBlocked } = await req.json();

    // Нельзя заблокировать самого себя
    if (admin.id === id) {
      return NextResponse.json(
        { error: "Нельзя заблокировать себя" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });
    if (!target) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }
    if (target.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Нельзя заблокировать главного администратора" },
        { status: 403 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        isBlocked,
        sessionVersion: isBlocked ? { increment: 1 } : undefined,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        isBlocked: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleRouteError(error, "[BLOCK_USER_ERROR]");
  }
}