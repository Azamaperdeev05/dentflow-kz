import { prisma } from "@/lib/db";

type AuditStatus = "SUCCESS" | "FAILED" | "DENIED";

type AuditLogInput = {
  userId?: string;
  userRole?: string;
  eventType: string;
  action: string;
  resource: string;
  resourceId?: string;
  status?: AuditStatus;
  riskScore?: number;
  isSuspicious?: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  metadata?: Record<string, unknown>;
};

function safeJson(value?: Record<string, unknown>) {
  if (!value) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export async function logSecurityEvent(input: AuditLogInput) {
  try {
    await prisma.securityAuditLog.create({
      data: {
        userId: input.userId,
        userRole: input.userRole,
        eventType: input.eventType,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        status: input.status ?? "SUCCESS",
        riskScore: input.riskScore ?? 0,
        isSuspicious: input.isSuspicious ?? false,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        deviceFingerprint: input.deviceFingerprint,
        metadata: safeJson(input.metadata),
      },
    });
  } catch {
    // Logging must never break the main flow.
  }
}

export function getRequestMeta(req: Request) {
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  return {
    ipAddress,
    userAgent,
  };
}

export async function logAccessDenied(input: Omit<AuditLogInput, "status" | "eventType"> & { eventType?: string }) {
  await logSecurityEvent({
    ...input,
    eventType: input.eventType ?? "RBAC",
    status: "DENIED",
  });
}
