import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authed = await getOptionalUser(req);
    if (!authed) {
      return NextResponse.json({ isBlocked: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: authed.id },
      select: {
        isBlocked: true,
        blockedReason: true,
        blockedUntil: true,
        bannedAt: true,
        blockedBy: true,
      },
    });

    const isBlocked = Boolean(user?.isBlocked);
    let blockedByName = null;
    if (user?.blockedBy && isBlocked) {
      const admin = await prisma.user.findUnique({
        where: { id: user.blockedBy },
        select: { name: true },
      });
      blockedByName = admin?.name;
    }

    return NextResponse.json({
      isBlocked,
      blockedReason: isBlocked ? user?.blockedReason : null,
      blockedUntil: isBlocked ? user?.blockedUntil : null,
      bannedAt: isBlocked ? user?.bannedAt : null,
      blockedByName,
    });
  } catch {
    return NextResponse.json({ isBlocked: false });
  }
}
