import { prisma } from "./prisma";

const LIMITS = {
  request: 8, // максимум 8 заявок в день
  offer: 15,  // максимум 15 откликов в день
};

function getTodayDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export async function checkDailyLimit(userId: string, action: "request" | "offer"): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  const today = getTodayDate();
  const limit = LIMITS[action];

  const record = await prisma.userDailyLimit.findUnique({
    where: {
      userId_action_date: {
        userId,
        action,
        date: today,
      },
    },
  });

  const currentCount = record?.count || 0;
  const remaining = Math.max(0, limit - currentCount);

  return {
    allowed: currentCount < limit,
    remaining,
    limit,
  };
}

export async function incrementDailyLimit(userId: string, action: "request" | "offer"): Promise<void> {
  const today = getTodayDate();

  await prisma.userDailyLimit.upsert({
    where: {
      userId_action_date: {
        userId,
        action,
        date: today,
      },
    },
    update: {
      count: { increment: 1 },
    },
    create: {
      userId,
      action,
      date: today,
      count: 1,
    },
  });
}