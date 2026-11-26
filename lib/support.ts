export const SUPPORT_CONTACT = (
  process.env.NEXT_PUBLIC_SUPPORT_CONTACT ||
  process.env.SUPPORT_CONTACT ||
  ""
).trim();

function looksLikeEmail(value: string) {
  return value.includes("@") && !value.startsWith("@");
}

export const SUPPORT_EMAIL = looksLikeEmail(SUPPORT_CONTACT)
  ? SUPPORT_CONTACT
  : SUPPORT_CONTACT;

export const SUPPORT_TELEGRAM = looksLikeEmail(SUPPORT_CONTACT)
  ? ""
  : SUPPORT_CONTACT.replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "");

export const SUPPORT_TELEGRAM_URL = SUPPORT_TELEGRAM
  ? `https://t.me/${SUPPORT_TELEGRAM}`
  : "";

export function supportHref(): string {
  if (!SUPPORT_CONTACT) return "";
  if (looksLikeEmail(SUPPORT_CONTACT)) return `mailto:${SUPPORT_CONTACT}`;
  if (SUPPORT_TELEGRAM_URL) return SUPPORT_TELEGRAM_URL;
  return SUPPORT_CONTACT;
}
