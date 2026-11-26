import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req, { allowBlocked: true });
    const { id } = await req.json();

    if (id === "all") {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    } else {
      const result = await prisma.notification.updateMany({
        where: { id, userId: user.id },
        data: { isRead: true },
      });
      if (result.count === 0) {
        throw new HttpError(404, "Уведомление не найдено");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "[MARK_READ_ERROR]");
  }
}
