import { prisma } from "@/lib/prisma";

interface LogData {
  adminId: string;
  adminName: string;
  adminRole: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAdminLog(data: LogData) {
  try {
    await prisma.adminLog.create({
      data: {
        adminId: data.adminId,
        adminName: data.adminName,
        adminRole: data.adminRole,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        targetName: data.targetName,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error("[ADMIN_LOG_ERROR]", error);
  }
}