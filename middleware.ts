import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

function decodeBase64Url(value: string): ArrayBuffer {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const decoded = atob(padded);
  const bytes = new Uint8Array(decoded.length);

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }

  return bytes.buffer;
}

async function hasValidJwt(token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  const parts = token.split(".");

  if (!secret || secret.length < 32 || parts.length !== 3) return false;

  try {
    const [header, body, signature] = parts;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(signature),
      new TextEncoder().encode(`${header}.${body}`),
    );
    if (!validSignature) return false;

    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(body))) as { exp?: unknown };
    return typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token || !(await hasValidJwt(token))) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
