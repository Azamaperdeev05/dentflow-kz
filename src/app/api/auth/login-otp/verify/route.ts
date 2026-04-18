import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { hashResetCode } from "@/lib/password-reset";
import { sanitizeEmail } from "@/lib/sanitize";
import { loginOtpVerifySchema } from "@/lib/validations";

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);

    // Verify endpoint has tighter rate limit against OTP guessing.
    if (!(await rateLimit(`login_otp_verify_${clientIp}`, 10, 15 * 60 * 1000))) {
      return Response.json({ error: "Тым көп талпыныс. 15 минуттан кейін көріңіз." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = loginOtpVerifySchema.parse(body);

    const email = sanitizeEmail(parsed.email);
    const codeHash = hashResetCode(parsed.code);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return Response.json({ error: "OTP код қате немесе мерзімі өткен" }, { status: 400 });
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
      return Response.json({ error: "OTP код қате немесе мерзімі өткен" }, { status: 400 });
    }

    await prisma.loginOtp.update({
      where: { id: otp.id },
      data: { used: true },
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ error: "Ішкі сервер қатесі" }, { status: 500 });
  }
}
