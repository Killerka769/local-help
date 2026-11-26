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
        blockedUntil: true,
        blockedReason: true,
        blockedBy: true,
        bannedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ isBlocked: false });
    }

    let isBlocked = user.isBlocked;
    if (user.blockedUntil && new Date(user.blockedUntil) < new Date()) {
      await prisma.user.update({
        where: { id: authed.id },
        data: {
          isBlocked: false,
          blockedBy: null,
          blockedReason: null,
          blockedUntil: null,
          bannedAt: null,
        },
      });
      isBlocked = false;
    }

    let blockedByName = null;
    if (user.blockedBy && isBlocked) {
      const admin = await prisma.user.findUnique({
        where: { id: user.blockedBy },
        select: { name: true },
      });
      blockedByName = admin?.name;
    }

    return NextResponse.json({
      isBlocked,
      blockedReason: isBlocked ? user.blockedReason : null,
      blockedUntil: isBlocked ? user.blockedUntil : null,
      bannedAt: isBlocked ? user.bannedAt : null,
      blockedByName,
    });
  } catch {
    return NextResponse.json({ isBlocked: false });
  }
}
