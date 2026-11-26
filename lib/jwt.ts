export const JWT_MIN_LENGTH = 32;

export function getJwtSecretBytes(): Uint8Array {
  const raw = process.env.JWT_SECRET ?? "";
  if (raw.length < JWT_MIN_LENGTH) {
    throw new Error("JWT_SECRET is missing or shorter than 32 characters");
  }
  return new TextEncoder().encode(raw);
}

export function getSiteUrl(req?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "http";
    if (host) return `${proto}://${host}`.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export function getPublicSiteUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) return null;
  return url.replace(/\/$/, "");
}
