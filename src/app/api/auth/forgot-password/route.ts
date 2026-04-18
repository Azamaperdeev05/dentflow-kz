import { Prisma } from "@prisma/client";
import { logSecurityEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { generateResetCode, getResetExpiry, hashResetCode } from "@/lib/password-reset";
import { forgotPasswordSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

function successResponse() {
  return Response.json({
    success: true,
    message: "Егер email тіркелген болса, код жіберілді.",
  });
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    
    // Rate limit: 3 attempts per 1 hour for forgot password
    if (!(await rateLimit(`forgot_${clientIp}`, 3, 60 * 60 * 1000))) {
      return Response.json(
        { error: "Тым көп талапты ұсындыңыз. 1 сағат сайын қайта көңіл бөріңіз" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      await logSecurityEvent({
        eventType: "AUTH",
        action: "PASSWORD_RESET_REQUEST",
        resource: "USER",
        status: "FAILED",
        ipAddress: clientIp,
        metadata: { reason: "USER_NOT_FOUND", email },
      });
      return successResponse();
    }

    const code = generateResetCode();
    const codeHash = hashResetCode(code);
    const expiresAt = getResetExpiry(15);

    await prisma.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        code: codeHash,
        expiresAt,
      },
    });

    await sendEmail({
      to: user.email,
      subject: "DentFlow KZ: Құпия сөзді қалпына келтіру коды",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>DentFlow KZ</h2>
          <p>Сәлем, ${user.name}!</p>
          <p>Құпия сөзді қалпына келтіру кодыңыз:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
          <p>Код 15 минут ішінде жарамды.</p>
        </div>
      `,
    });

    await logSecurityEvent({
      userId: user.id,
      eventType: "AUTH",
      action: "PASSWORD_RESET_REQUEST",
      resource: "USER",
      status: "SUCCESS",
      ipAddress: clientIp,
      metadata: { email: user.email },
    });

    return successResponse();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return Response.json({ error: "Деректер базасы қатесі" }, { status: 500 });
    }

    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ error: "Ішкі сервер қатесі" }, { status: 500 });
  }
}
