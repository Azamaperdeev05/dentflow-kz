import { compare } from "bcryptjs";
import { logSecurityEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { generateResetCode, getResetExpiry, hashResetCode } from "@/lib/password-reset";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeEmail } from "@/lib/sanitize";
import { twoFactorRecoveryRequestSchema } from "@/lib/validations";

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);

    if (!(await rateLimit(`2fa_recovery_request_${clientIp}`, 5, 15 * 60 * 1000))) {
      return Response.json({ error: "Тым көп сұрау. 15 минуттан кейін қайталап көріңіз." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = twoFactorRecoveryRequestSchema.parse(body);
    const email = sanitizeEmail(parsed.email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, password: true, isVerified: true, twoFactorEnabled: true },
    });

    if (!user) {
      return Response.json({ error: "Email немесе құпия сөз қате" }, { status: 401 });
    }

    const isValidPassword = await compare(parsed.password, user.password);
    if (!isValidPassword) {
      return Response.json({ error: "Email немесе құпия сөз қате" }, { status: 401 });
    }

    if (!user.isVerified) {
      return Response.json({ error: "Email расталмаған" }, { status: 403 });
    }

    if (!user.twoFactorEnabled) {
      return Response.json({ error: "Бұл аккаунтта 2FA қосылмаған" }, { status: 400 });
    }

    const code = generateResetCode();
    const codeHash = hashResetCode(code);
    const expiresAt = getResetExpiry(10);

    await prisma.loginOtp.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    await prisma.loginOtp.create({
      data: { userId: user.id, code: codeHash, expiresAt },
    });

    await sendEmail({
      to: user.email,
      subject: "DentFlow KZ: 2FA қалпына келтіру коды",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2 style="margin: 0 0 12px;">DentFlow KZ</h2>
          <p>Сәлем, ${user.name}!</p>
          <p>2FA аутентификаторыңызды қалпына келтіру үшін код:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 12px 0;">${code}</p>
          <p>Код 10 минут ішінде жарамды.</p>
          <p style="color: #dc2626;">Егер бұл сіз болмасаңыз, дереу құпия сөзіңізді өзгертіңіз!</p>
        </div>
      `,
    });

    await logSecurityEvent({
      userId: user.id,
      userRole: undefined,
      eventType: "AUTH",
      action: "TWO_FACTOR_RECOVERY_REQUESTED",
      resource: "SESSION",
      status: "SUCCESS",
      ipAddress: clientIp,
      metadata: { email },
    });

    return Response.json({ success: true, message: "Қалпына келтіру коды email-ге жіберілді." });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Ішкі сервер қатесі" }, { status: 500 });
  }
}
