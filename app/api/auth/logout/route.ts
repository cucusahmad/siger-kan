import { logout } from "@/features/auth/auth.service";
import { AUTH_COOKIE_NAME, clearAuthCookie } from "@/lib/auth-cookie";
import { getRequestContext } from "@/lib/request-context";

function getCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get("cookie")?.split(";") ?? [];

  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) return value.join("=");
  }

  return null;
}

export async function POST(request: Request): Promise<Response> {
  const token = getCookie(request, AUTH_COOKIE_NAME);

  try {
    if (token) await logout(token, getRequestContext(request));
  } catch (error: unknown) {
    console.error("Unexpected logout error", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }

  const response = Response.json({
    success: true,
    message: "Anda telah keluar.",
    data: { redirectTo: "/login" },
  });
  response.headers.set("Set-Cookie", clearAuthCookie());
  response.headers.set("Cache-Control", "no-store");
  return response;
}
