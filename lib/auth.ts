import { jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJwtSecretBytes } from "@/lib/jwt";
import { HttpError } from "@/lib/http";

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  role: string;
  isBlocked: boolean;
  sessionVersion: number;
  cityId: string;
};

function readToken(req: Request): string | null {
  if (req instanceof NextRequest || (typeof (req as NextRequest).cookies?.get === "function")) {
    const fromCookie = (req as NextRequest).cookies.get("token")?.value;
    if (fromCookie) return fromCookie;
  }
  const header = req.headers.get("cookie");
  const match = header?.match(/(?:^|; )token=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function clearExpiredBan(userId: string, blockedUntil: Date | null, isBlocked: boolean) {
  if (!isBlocked || !blockedUntil) return isBlocked;
  if (blockedUntil >= new Date()) return isBlocked;

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
  return false;
}

export async function getAuthedUser(
  req: Request,
  options: { allowBlocked?: boolean } = {}
): Promise<AuthUser> {
  const token = readToken(req);
  if (!token) {
    throw new HttpError(401, "Не авторизован");
  }

  let userId: string;
  let tokenSessionVersion: number;
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    userId = payload.userId as string;
    tokenSessionVersion = (payload.sessionVersion as number) || 0;
  } catch {
    throw new HttpError(401, "Не авторизован");
  }

  if (!userId) {
    throw new HttpError(401, "Не авторизован");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      isBlocked: true,
      blockedUntil: true,
      sessionVersion: true,
      cityId: true,
    },
  });

  if (!user) {
    throw new HttpError(401, "Не авторизован");
  }

  if (tokenSessionVersion !== user.sessionVersion) {
    throw new HttpError(401, "Не авторизован");
  }

  const isBlocked = await clearExpiredBan(user.id, user.blockedUntil, user.isBlocked);

  if (isBlocked && !options.allowBlocked) {
    throw new HttpError(403, "Ваш аккаунт заблокирован");
  }

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    isBlocked,
    sessionVersion: user.sessionVersion,
    cityId: user.cityId,
  };
}

export async function getOptionalUser(req: Request): Promise<AuthUser | null> {
  try {
    return await getAuthedUser(req, { allowBlocked: true });
  } catch {
    return null;
  }
}

export async function getCurrentUser(req: Request) {
  try {
    return await getAuthedUser(req, { allowBlocked: true });
  } catch {
    return null;
  }
}

export async function requireUser(
  req: Request,
  options: { allowBlocked?: boolean } = {}
) {
  return getAuthedUser(req, options);
}

export async function requireAdmin(req: Request) {
  const user = await getAuthedUser(req);
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new HttpError(403, "Доступ запрещён");
  }
  return user;
}

export async function requireSuperAdmin(req: Request) {
  const user = await getAuthedUser(req);
  if (user.role !== "SUPER_ADMIN") {
    throw new HttpError(403, "Доступ запрещён");
  }
  return user;
}
