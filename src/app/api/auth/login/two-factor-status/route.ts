import { compare } from "bcryptjs";
import { logSecurityEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { deriveDeviceFingerprint, updateLoginRiskSignal } from "@/lib/security-risk";
import { sanitizeEmail } from "@/lib/sanitize";
import { loginSchema } from "@/lib/validations";

function requestMeta(req: Request) {
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  return {
    ipAddress,
    userAgent,
    deviceFingerprint: deriveDeviceFingerprint(userAgent),
  };
}

export async function POST(req: Request) {
  try {
    const meta = requestMeta(req);
    await enforceMutationGuard(req, {
      key: "login_two_factor_status",
      maxAttempts: 20,
      windowMs: 15 * 60 * 1000,
    });

    const body = await req.json();
    const parsed = loginSchema.parse(body);
    const email = sanitizeEmail(parsed.email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        password: true,
        isVerified: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      const risk = await updateLoginRiskSignal({
        email,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        isSuccess: false,
      });

      await logSecurityEvent({
        eventType: "AUTH",
        action: "LOGIN_PRECHECK_FAILED",
        resource: "SESSION",
        status: "FAILED",
        riskScore: risk.riskScore,
        isSuspicious: risk.isSuspicious,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        deviceFingerprint: meta.deviceFingerprint,
        metadata: { reason: "USER_NOT_FOUND", email },
      });
      return Response.json({ error: "Email немесе құпиясөз қате" }, { status: 401 });
    }

    const isValidPassword = await compare(parsed.password, user.password);
    if (!isValidPassword) {
      const risk = await updateLoginRiskSignal({
        userId: user.id,
        email,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        isSuccess: false,
      });

      await logSecurityEvent({
        userId: user.id,
        userRole: user.role,
        eventType: "AUTH",
        action: "LOGIN_PRECHECK_FAILED",
        resource: "SESSION",
        status: "FAILED",
        riskScore: risk.riskScore,
        isSuspicious: risk.isSuspicious,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        deviceFingerprint: meta.deviceFingerprint,
        metadata: { reason: "INVALID_PASSWORD", failedAttempts: risk.failedAttempts },
      });
      return Response.json({ error: "Email немесе құпиясөз қате" }, { status: 401 });
    }

    if (!user.isVerified) {
      await logSecurityEvent({
        userId: user.id,
        userRole: user.role,
        eventType: "AUTH",
        action: "LOGIN_PRECHECK_FAILED",
        resource: "SESSION",
        status: "FAILED",
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        deviceFingerprint: meta.deviceFingerprint,
        metadata: { reason: "EMAIL_NOT_VERIFIED" },
      });
      return Response.json({ error: "Email расталмаған" }, { status: 403 });
    }

    return Response.json({
      success: true,
      requiresTwoFactor: user.twoFactorEnabled,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CSRF_INVALID") {
      return Response.json({ error: "CSRF тексерісі өтпеді" }, { status: 403 });
    }

    if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
      return Response.json({ error: "Тым көп сұраныс. Кейінірек қайталап көріңіз" }, { status: 429 });
    }

    return Response.json({ error: "Сервер қатесі" }, { status: 500 });
  }
}
