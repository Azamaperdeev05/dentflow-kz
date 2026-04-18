import { prisma } from "@/lib/db";

export async function rateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
): Promise<boolean> {
  const now = new Date();
  const nextResetAt = new Date(now.getTime() + windowMs);

  return prisma.$transaction(async (tx) => {
    const current = await tx.rateLimitAttempt.findUnique({
      where: { key: identifier },
      select: { key: true, count: true, resetAt: true },
    });

    if (!current || current.resetAt <= now) {
      await tx.rateLimitAttempt.upsert({
        where: { key: identifier },
        update: { count: 1, resetAt: nextResetAt },
        create: { key: identifier, count: 1, resetAt: nextResetAt },
      });
      return true;
    }

    if (current.count >= maxAttempts) {
      return false;
    }

    await tx.rateLimitAttempt.update({
      where: { key: identifier },
      data: { count: { increment: 1 } },
    });

    return true;
  });
}

export async function getRemainingAttempts(identifier: string, maxAttempts: number = 5): Promise<number> {
  const current = await prisma.rateLimitAttempt.findUnique({
    where: { key: identifier },
    select: { count: true, resetAt: true },
  });

  if (!current || current.resetAt <= new Date()) {
    return maxAttempts;
  }

  return Math.max(0, maxAttempts - current.count);
}
