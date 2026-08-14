export const AUTH_COOKIE_NAME = "sigerkan_access";

export function shouldUseSecureAuthCookie(request: Request): boolean {
  const configuredValue = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();

  if (configuredValue === "true") return true;
  if (configuredValue === "false") return false;
  if (process.env.NODE_ENV === "production") return true;

  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();

  return forwardedProtocol ? forwardedProtocol === "https" : new URL(request.url).protocol === "https:";
}

export function createAuthCookie(token: string, expiresAt: Date, secure: boolean): string {
  const attributes = [
    `${AUTH_COOKIE_NAME}=${token}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Expires=${expiresAt.toUTCString()}`,
  ];

  if (secure) attributes.splice(2, 0, "Secure");

  return attributes.join("; ");
}

export function clearAuthCookie(secure: boolean): string {
  const attributes = [
    `${AUTH_COOKIE_NAME}=`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=0",
  ];

  if (secure) attributes.splice(2, 0, "Secure");

  return attributes.join("; ");
}
