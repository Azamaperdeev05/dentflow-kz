/**
 * Performance optimization utilities
 */

// Cache for frequently accessed data
const cache = new Map<string, { data: unknown; expiresAt: number }>();

/**
 * Get cached data or fetch fresh data
 */
export function getFromCache<T>(
  key: string,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): T | null {
  const record = cache.get(key);
  
  if (!record) {
    return null;
  }
  
  if (Date.now() > record.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return record.data as T;
}

/**
 * Set data in cache
 */
export function setInCache<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * Invalidate cache by key pattern
 */
export function invalidateCache(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Optimize Prisma queries by suggesting indexes
 * This is informational - actual indexes should be created in schema
 */
export const queryOptimizationTips = {
  appointments:
    "SELECT index on (doctorId, status, createdAt) recommended for faster filtering",
  messages: "SELECT index on (receiverId, isRead, createdAt) recommended for unread messages",
  users: "SELECT index on (email) already in schema - good for lookups",
  treatments: "SELECT index on (patientId, status) recommended for patient history",
};

/**
 * Request timeout helper to prevent long-running queries
 */
export function withTimeout<T>(promise: Promise<T>, ms: number = 30000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout")), ms)
    ),
  ]);
}
