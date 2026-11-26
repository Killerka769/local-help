import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireUser(req, { allowBlocked: true });
    const { password } = await req.json();

    if (!password) {
      throw new HttpError(400, "Введите пароль для подтверждения");
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new HttpError(404, "Пользователь не найден");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new HttpError(400, "Неверный пароль");
    }

    const userId = authUser.id;

    await prisma.$transaction(async (tx) => {
      const ownRequests = await tx.request.findMany({
        where: { authorId: userId },
        select: { id: true },
      });
      const requestIds = ownRequests.map((r) => r.id);

      await tx.review.deleteMany({
        where: {
          OR: [
            { fromUserId: userId },
            { toUserId: userId },
            { requestId: { in: requestIds } },
          ],
        },
      });
      await tx.offer.deleteMany({
        where: {
          OR: [{ userId }, { requestId: { in: requestIds } }],
        },
      });
      await tx.favorite.deleteMany({
        where: {
          OR: [
            { userId },
            ...(requestIds.length > 0 ? [{ requestId: { in: requestIds } }] : []),
          ],
        },
      });
      await tx.complaint.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.cityRequest.deleteMany({ where: { userId } });
      await tx.userDailyLimit.deleteMany({ where: { userId } });
      await tx.emailVerificationToken.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      if (requestIds.length > 0) {
        await tx.request.deleteMany({ where: { id: { in: requestIds } } });
      }
      await tx.user.delete({ where: { id: userId } });
    });

    const response = NextResponse.json({ success: true });
    response.cookies.delete("token");
    return response;
  } catch (error) {
    return handleRouteError(error, "[DELETE_ACCOUNT_ERROR]");
  }
}
