import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ isBlocked: false });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isBlocked: true,
        blockedReason: true,
        blockedUntil: true,
        bannedAt: true,
        blockedBy: true,
      },
    });

    let blockedByName = null;
    if (user?.blockedBy) {
      const admin = await prisma.user.findUnique({
        where: { id: user.blockedBy },
        select: { name: true },
      });
      blockedByName = admin?.name;
    }

    return NextResponse.json({
      isBlocked: user?.isBlocked || false,
      blockedReason: user?.blockedReason,
      blockedUntil: user?.blockedUntil,
      bannedAt: user?.bannedAt,
      blockedByName,
    });
  } catch (error) {
    return NextResponse.json({ isBlocked: false });
  }
}