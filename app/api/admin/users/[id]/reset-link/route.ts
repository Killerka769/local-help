import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";
import { createAdminLog } from "@/lib/adminLog";
import { getSiteUrl } from "@/lib/jwt";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin(req);
    const { id } = await params;

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, phone: true },
    });

    if (!target) {
      throw new HttpError(404, "Пользователь не найден");
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({ where: { userId: id } });
    await prisma.passwordResetToken.create({
      data: { userId: id, token, expiresAt },
    });

    const url = `${getSiteUrl(req)}/reset-password?token=${token}`;

    await createAdminLog({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: "reset_link",
      targetType: "user",
      targetId: id,
      targetName: target.name,
      details: `Одноразовая ссылка сброса пароля, срок 1 час. Телефон ${target.phone}`,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ url, expiresAt });
  } catch (error) {
    return handleRouteError(error, "[ADMIN_RESET_LINK_ERROR]");
  }
}
