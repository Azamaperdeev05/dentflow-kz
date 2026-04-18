import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { generateResetCode, getResetExpiry, hashResetCode } from "@/lib/password-reset";
import { sanitizeEmail } from "@/lib/sanitize";
import { loginOtpRequestSchema } from "@/lib/validations";

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);

    // Rate limit OTP requests to reduce brute-force attempts.
    if (!(await rateLimit(`login_otp_request_${clientIp}`, 5, 15 * 60 * 1000))) {
      return Response.json({ error: "Тым көп сұрау. 15 минуттан кейін қайталап көріңіз." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = loginOtpRequestSchema.parse(body);
    const email = sanitizeEmail(parsed.email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, password: true, isVerified: true },
    });

    if (!user) {
      return Response.json({ error: "Email немесе құпия сөз қате" }, { status: 401 });
    }

    const isValidPassword = await compare(parsed.password, user.password);
    if (!isValidPassword) {
      return Response.json({ error: "Email немесе құпия сөз қате" }, { status: 401 });
    }

    if (!user.isVerified) {
      return Response.json({ error: "Email расталмаған. Алдымен тіркелу кодын растаңыз." }, { status: 403 });
    }

    const code = generateResetCode();
    const codeHash = hashResetCode(code);
    const expiresAt = getResetExpiry(10);

    await prisma.loginOtp.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    await prisma.loginOtp.create({
      data: {
        userId: user.id,
        code: codeHash,
        expiresAt,
      },
    });

    await sendEmail({
      to: user.email,
      subject: "DentFlow KZ: Кіру OTP коды",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2 style="margin: 0 0 12px;">DentFlow KZ</h2>
          <p>Сәлем, ${user.name}!</p>
          <p>Жүйеге кіру үшін OTP кодыңыз:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 12px 0;">${code}</p>
          <p>Код 10 минут ішінде жарамды.</p>
          <p>Егер бұл сіз болмасаңыз, осы хатты елемеңіз.</p>
        </div>
      `,
    });

    return Response.json({
      success: true,
      message: "OTP коды email-ге жіберілді.",
    });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ error: "Ішкі сервер қатесі" }, { status: 500 });
  }
}
