import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const user = await prisma.user.update({
      where: { id },
      data: { isBlocked },
      select: {
        id: true,
        name: true,
        phone: true,
        isBlocked: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[BLOCK_USER_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}