import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function getCurrentUser(req: Request) {
  const cookie = req.headers.get("cookie");
  const tokenMatch = cookie?.match(/token=([^;]+)/);
  const token = tokenMatch?.[1];

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        isBlocked: true,
        createdAt: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export async function requireAdmin(req: Request) {
  const user = await getCurrentUser(req);
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Доступ запрещён");
  }
  return user;
}

export async function requireSuperAdmin(req: Request) {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "SUPER_ADMIN") {
    throw new Error("Доступ запрещён");
  }
  return user;
}