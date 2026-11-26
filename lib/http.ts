import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function handleRouteError(error: unknown, logLabel: string) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(logLabel, error);
  return NextResponse.json(
    { error: "Внутренняя ошибка сервера" },
    { status: 500 }
  );
}
