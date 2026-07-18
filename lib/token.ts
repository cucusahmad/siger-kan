import { createHash, randomBytes } from "node:crypto";

interface VerificationToken {
  readonly tokenHash: string;
  readonly expiresAt: Date;
}

const VERIFICATION_TOKEN_BYTES = 32;
const VERIFICATION_TOKEN_TTL_HOURS = 24;

export function createEmailVerificationToken(): VerificationToken {
  const rawToken = randomBytes(VERIFICATION_TOKEN_BYTES);
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(
    Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000,
  );

  return { tokenHash, expiresAt };
}
