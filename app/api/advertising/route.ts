import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Заполните обязательные поля" }, { status: 400 });
    }

    await prisma.advertisingRequest.create({
      data: {
        name,
        email,
        company: company || null,
        message,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADVERTISING_ERROR]", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}