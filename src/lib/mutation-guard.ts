import { assertSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";

type MutationGuardOptions = {
  key: string;
  identity?: string;
  maxAttempts?: number;
  windowMs?: number;
};

const DEFAULT_MAX_ATTEMPTS = 40;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

export function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

export async function enforceMutationGuard(req: Request, options: MutationGuardOptions): Promise<void> {
  assertSameOrigin(req);

  const keyParts = [options.key, getClientIp(req)];
  if (options.identity) {
    keyParts.push(options.identity);
  }

  const allowed = await rateLimit(
    keyParts.join("_"),
    options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    options.windowMs ?? DEFAULT_WINDOW_MS,
  );

  if (!allowed) {
    throw new Error("RATE_LIMIT_EXCEEDED");
  }
}
