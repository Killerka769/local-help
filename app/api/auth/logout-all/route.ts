import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req, { allowBlocked: true });

    await prisma.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } },
    });

    const response = NextResponse.json({ success: true });
    response.cookies.delete("token");
    return response;
  } catch (error) {
    return handleRouteError(error, "[LOGOUT_ALL_ERROR]");
  }
}
