export const AUTH_COOKIE_NAME = "sigerkan_access";

export function createAuthCookie(token: string, expiresAt: Date): string {
  return [
    `${AUTH_COOKIE_NAME}=${token}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/",
    `Expires=${expiresAt.toUTCString()}`,
  ].join("; ");
}

export function clearAuthCookie(): string {
  return [
    `${AUTH_COOKIE_NAME}=`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=0",
  ].join("; ");
}
