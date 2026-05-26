import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const revalidate = 3600; // кэш на 1 час
export async function GET() {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        region: true,
      },
    });

    return NextResponse.json({ cities });
  } catch (error) {
    console.error("[CITIES_ERROR]", error);
    return NextResponse.json(
      { error: "Ошибка загрузки городов" },
      { status: 500 }
    );
  }
}