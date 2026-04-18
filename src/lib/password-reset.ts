import { createHash, randomInt } from "crypto";

export function generateResetCode(): string {
  return String(randomInt(100000, 1000000));
}

export function hashResetCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function getResetExpiry(minutes = 15): Date {
  const now = Date.now();
  return new Date(now + minutes * 60 * 1000);
}
