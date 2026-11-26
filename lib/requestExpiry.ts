import { prisma } from "@/lib/prisma";

export function computeExpiresAt(createdAt: Date, deadlineDays: number): Date {
  const expires = new Date(createdAt);
  expires.setUTCDate(expires.getUTCDate() + deadlineDays);
  return expires;
}

export function isPastDeadline(createdAt: Date, deadlineDays: number, now = new Date()): boolean {
  return computeExpiresAt(createdAt, deadlineDays) <= now;
}

export async function expireOverdueRequests(): Promise<number> {
  const result = await prisma.request.updateMany({
    where: {
      status: "active",
      expiresAt: { lte: new Date() },
    },
    data: { status: "expired" },
  });
  return result.count;
}
