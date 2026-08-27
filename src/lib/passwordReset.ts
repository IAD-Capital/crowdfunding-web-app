import crypto from "crypto";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, tokenHash: hashResetToken(token) };
}

// Only the hash is ever stored — a leaked DB dump can't be turned back into a
// usable reset link.
export function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
