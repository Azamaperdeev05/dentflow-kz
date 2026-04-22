import { logSecurityEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { hashResetCode } from "@/lib/password-reset";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeEmail } from "@/lib/sanitize";
import { twoFactorRecoveryVerifySchema } from "@/lib/validations";

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);

    if (!(await rateLimit(`2fa_recovery_verify_${clientIp}`, 10, 15 * 60 * 1000))) {
      return Response.json({ error: "Тым көп талпыныс. 15 минуттан кейін қайталап көріңіз." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = twoFactorRecoveryVerifySchema.parse(body);
    const email = sanitizeEmail(parsed.email);
    const codeHash = hashResetCode(parsed.code);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, twoFactorEnabled: true },
    });

    if (!user) {
      return Response.json({ error: "Қолданушы табылмады" }, { status: 404 });
    }

    if (!user.twoFactorEnabled) {
      return Response.json({ error: "Бұл аккаунтта 2FA қосылмаған" }, { status: 400 });
    }

    const otp = await prisma.loginOtp.findFirst({
      where: {
        userId: user.id,
        code: codeHash,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return Response.json({ error: "Код қате немесе мерзімі өткен" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.loginOtp.update({ where: { id: otp.id }, data: { used: true } }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorTempSecret: null,
        },
      }),
    ]);

    await logSecurityEvent({
      userId: user.id,
      eventType: "AUTH",
      action: "TWO_FACTOR_RECOVERY_COMPLETED",
      resource: "SESSION",
      status: "SUCCESS",
      ipAddress: clientIp,
      metadata: { email },
    });

    return Response.json({ success: true, message: "2FA өшірілді. Енді жүйеге кіре аласыз." });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Ішкі сервер қатесі" }, { status: 500 });
  }
}
