import { NextRequest, NextResponse } from "next/server";
import { expireOverdueRequests } from "@/lib/requestExpiry";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  const count = await expireOverdueRequests();
  return NextResponse.json({ ok: true, expired: count });
}
