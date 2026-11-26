import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { getJwtSecretBytes } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ isValid: false }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    const userId = payload.userId as string;
    const tokenSessionVersion = (payload.sessionVersion as number) || 0;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        sessionVersion: true,
        isBlocked: true,
        blockedReason: true,
        blockedUntil: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ isValid: false }, { status: 401 });
    }

    if (tokenSessionVersion !== user.sessionVersion) {
      return NextResponse.json({ isValid: false }, { status: 401 });
    }

    let isBlocked = user.isBlocked;
    if (user.blockedUntil && new Date(user.blockedUntil) < new Date()) {
      await prisma.user.update({
        where: { id: userId },
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

    return NextResponse.json({
      isValid: true,
      isBlocked,
      role: user.role,
      blockedReason: user.blockedReason,
      blockedUntil: user.blockedUntil,
    });
  } catch {
    return NextResponse.json({ isValid: false }, { status: 401 });
  }
}
