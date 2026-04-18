/**
 * CSRF Protection utilities
 */

import { randomBytes } from "crypto";

const tokenStore = new Map<string, { token: string; createdAt: number }>();
const TOKEN_EXPIRY = 1000 * 60 * 60; // 1 hour

function isSafeMethod(method: string): boolean {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

export function verifySameOrigin(request: Request): boolean {
  if (isSafeMethod(request.method.toUpperCase())) {
    return true;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  try {
    const requestOrigin = new URL(request.url).origin;
    return origin === requestOrigin;
  } catch {
    return false;
  }
}

export function assertSameOrigin(request: Request): void {
  if (!verifySameOrigin(request)) {
    throw new Error("CSRF_INVALID");
  }
}

export function generateCSRFToken(): string {
  const token = randomBytes(32).toString("hex");
  tokenStore.set(token, { token, createdAt: Date.now() });
  
  // Cleanup old tokens
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (now - value.createdAt > TOKEN_EXPIRY) {
      tokenStore.delete(key);
    }
  }
  
  return token;
}

export function verifyCSRFToken(token: string): boolean {
  const record = tokenStore.get(token);
  
  if (!record) {
    return false;
  }
  
  const now = Date.now();
  if (now - record.createdAt > TOKEN_EXPIRY) {
    tokenStore.delete(token);
    return false;
  }
  
  // Consume the token (single-use)
  tokenStore.delete(token);
  return true;
}
