export const MIN_PASSWORD_LENGTH = 8;

export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Пароль должен быть минимум ${MIN_PASSWORD_LENGTH} символов`;
  }
  return null;
}
