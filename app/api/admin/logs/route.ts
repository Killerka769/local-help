import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const action = searchParams.get("action") || "";
    const adminId = searchParams.get("adminId") || "";

    const where: any = {};
    if (action) where.action = action;
    if (adminId) where.adminId = adminId;

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.adminLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleRouteError(error, "[ADMIN_LOGS_ERROR]");
  }
}