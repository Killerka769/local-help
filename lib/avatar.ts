function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local")) return true;
  if (host === "127.0.0.1" || host === "::1" || host === "0.0.0.0") return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  return false;
}

export function sanitizeAvatarUrl(value: unknown): string | null {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new Error("Неверный URL аватара");
  }
  const trimmed = value.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Неверный URL аватара");
  }

  if (url.protocol !== "https:") {
    throw new Error("Аватар должен быть ссылкой https");
  }
  if (url.username || url.password) {
    throw new Error("Неверный URL аватара");
  }
  if (isPrivateHostname(url.hostname)) {
    throw new Error("Неверный URL аватара");
  }
  return url.toString();
}
