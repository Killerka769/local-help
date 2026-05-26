import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") || "all";

    const where: any = {};
    if (status !== "all") {
      where.status = status;
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.complaint.count({ where }),
    ]);

    const complaintsWithTarget = await Promise.all(
      complaints.map(async (complaint) => {
        let target = null;
        
        if (complaint.targetType === "request") {
          target = await prisma.request.findUnique({
            where: { id: complaint.targetId },
            include: {
              author: {
                select: { id: true, name: true, phone: true },
              },
            },
          });
        } else if (complaint.targetType === "offer") {
          target = await prisma.offer.findUnique({
            where: { id: complaint.targetId },
            include: {
              user: {
                select: { id: true, name: true, phone: true },
              },
              request: {
                select: { id: true, title: true },
              },
            },
          });
        } else if (complaint.targetType === "user") {
          target = await prisma.user.findUnique({
            where: { id: complaint.targetId },
            select: {
              id: true,
              name: true,
              phone: true,
              avatar: true,
              description: true,
              createdAt: true,
              role: true,
              isBlocked: true,
            },
          });
        }

        return {
          ...complaint,
          target,
        };
      })
    );

    return NextResponse.json({
      complaints: complaintsWithTarget,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[ADMIN_COMPLAINTS_ERROR]", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}