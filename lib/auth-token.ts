import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

interface AccessTokenPayload {
  readonly sub: string;
  readonly sid: string;
  readonly iat: number;
  readonly exp: number;
}

const ACCESS_TOKEN_TTL_SECONDS = 8 * 60 * 60;
const REMEMBERED_ACCESS_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }

  return secret;
}

function encode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createOpaqueToken(): string {
  return randomBytes(48).toString("base64url");
}

export function createAccessToken(
  userId: bigint,
  sessionId: bigint,
  rememberMe: boolean,
): { readonly token: string; readonly expiresAt: Date } {
  const issuedAt = Math.floor(Date.now() / 1000);
  const ttl = rememberMe
    ? REMEMBERED_ACCESS_TOKEN_TTL_SECONDS
    : ACCESS_TOKEN_TTL_SECONDS;
  const payload: AccessTokenPayload = {
    sub: userId.toString(),
    sid: sessionId.toString(),
    iat: issuedAt,
    exp: issuedAt + ttl,
  };
  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = encode(JSON.stringify(payload));
  const signature = createHmac("sha256", getJwtSecret())
    .update(`${header}.${body}`)
    .digest("base64url");

  return {
    token: `${header}.${body}.${signature}`,
    expiresAt: new Date(payload.exp * 1000),
  };
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  const parts = token.split(".");

  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expected = createHmac("sha256", getJwtSecret())
    .update(`${header}.${body}`)
    .digest();
  let actual: Buffer;

  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<AccessTokenPayload>;
    const now = Math.floor(Date.now() / 1000);

    if (
      typeof payload.sub !== "string"
      || !/^\d+$/.test(payload.sub)
      || typeof payload.sid !== "string"
      || !/^\d+$/.test(payload.sid)
      || typeof payload.iat !== "number"
      || typeof payload.exp !== "number"
      || payload.exp <= now
    ) {
      return null;
    }

    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}
