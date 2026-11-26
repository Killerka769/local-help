export const DISTRICT_MIN = 3;
export const DISTRICT_MAX = 80;

export function readDistrict(body: {
  district?: unknown;
  address?: unknown;
}): string {
  const raw = body.district ?? body.address;
  return typeof raw === "string" ? raw.trim() : "";
}

export function districtError(district: string): string | null {
  if (district.length < DISTRICT_MIN || district.length > DISTRICT_MAX) {
    return `Район или ориентир: от ${DISTRICT_MIN} до ${DISTRICT_MAX} символов`;
  }
  if (/^[0-9\s\-_]+$/.test(district)) {
    return "Укажите район или ориентир, а не только цифры";
  }
  return null;
}
