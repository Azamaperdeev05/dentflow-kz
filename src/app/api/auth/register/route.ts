import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { generateResetCode, getResetExpiry, hashResetCode } from "@/lib/password-reset";
import { upsertPendingRegistration } from "@/lib/pending-registration";
import { sanitizeEmail } from "@/lib/sanitize";

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    
    // Rate limit: 5 attempts per 15 minutes
    if (!(await rateLimit(`register_${clientIp}`, 5, 15 * 60 * 1000))) {
      return Response.json(
        { error: "Тым көп талапты ұсындыңыз. 15 минут сайын қайта көңіл бөріңіз" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.parse(body);
    const email = sanitizeEmail(parsed.email);

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isVerified: true },
    });

    if (existingUser?.isVerified) {
      return Response.json({ error: "Email бұрыннан тіркелген" }, { status: 400 });
    }

    const hashedPassword = await hash(parsed.password, 14);
    const code = generateResetCode();
    const codeHash = hashResetCode(code);
    const expiresAt = getResetExpiry(10);

    if (existingUser && !existingUser.isVerified) {
      await prisma.loginOtp.create({
        data: {
          userId: existingUser.id,
          code: codeHash,
          expiresAt,
        },
      });
    } else {
      await upsertPendingRegistration({
        email,
        name: parsed.name,
        phone: parsed.phone || null,
        passwordHash: hashedPassword,
        role: parsed.role,
        specialization: parsed.role === "DOCTOR" ? parsed.specialization?.trim() || null : null,
        experience:
          parsed.role === "DOCTOR" && typeof parsed.experience === "number" && Number.isFinite(parsed.experience)
            ? parsed.experience
            : null,
        licenseNumber: parsed.role === "DOCTOR" ? parsed.licenseNumber || null : null,
        codeHash,
        expiresAt,
        createdAt: new Date(),
      });
    }

    await sendEmail({
      to: email,
      subject: "DentFlow KZ: Тіркелуді растау коды",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2 style="margin: 0 0 12px;">DentFlow KZ</h2>
          <p>Тіркелуіңіз үшін рахмет.</p>
          <p>Аккаунтты растау коды:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 12px 0;">${code}</p>
          <p>Код 10 минут ішінде жарамды.</p>
        </div>
      `,
    });

    return Response.json({
      success: true,
      requiresVerification: true,
      message: "Тіркелу сәтті. Email-ге растау коды жіберілді.",
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return Response.json({ error: "Деректерді сақтау қатесі" }, { status: 500 });
    }

    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ error: "Ішкі сервер қатесі" }, { status: 500 });
  }
}
