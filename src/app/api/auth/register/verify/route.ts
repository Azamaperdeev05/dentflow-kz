import { prisma } from "@/lib/db";
import { hashResetCode } from "@/lib/password-reset";
import { clearPendingRegistration, getPendingRegistration } from "@/lib/pending-registration";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeEmail } from "@/lib/sanitize";
import { registerVerifySchema } from "@/lib/validations";

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);

    if (!(await rateLimit(`register_verify_${clientIp}`, 10, 15 * 60 * 1000))) {
      return Response.json({ error: "Тым көп талпыныс. 15 минуттан кейін көріңіз." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = registerVerifySchema.parse(body);
    const email = sanitizeEmail(parsed.email);
    const codeHash = hashResetCode(parsed.code);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isVerified: true },
    });

    if (user?.isVerified) {
      await clearPendingRegistration(email);
      return Response.json({ success: true, message: "Аккаунт бұған дейін расталған" });
    }

    const pending = await getPendingRegistration(email);

    if (pending) {
      if (pending.codeHash !== codeHash) {
        return Response.json({ error: "Код қате немесе мерзімі өткен" }, { status: 400 });
      }

      if (pending.expiresAt <= new Date()) {
        await clearPendingRegistration(email);
        return Response.json({ error: "Код қате немесе мерзімі өткен" }, { status: 400 });
      }

      await prisma.user.create({
        data: {
          name: pending.name,
          email: pending.email,
          phone: pending.phone,
          password: pending.passwordHash,
          role: pending.role,
          isVerified: true,
          ...(pending.role === "PATIENT"
            ? {
                patientProfile: {
                  create: {},
                },
              }
            : {
                doctorProfile: {
                  create: {
                    specialization: pending.specialization ?? "Жалпы стоматология",
                    experience: pending.experience ?? 0,
                    licenseNumber: pending.licenseNumber,
                  },
                },
              }),
        },
      });

      await clearPendingRegistration(email);
      return Response.json({ success: true, message: "Email сәтті расталды" });
    }

    if (!user) {
      return Response.json({ error: "Қолданушы табылмады" }, { status: 404 });
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
      prisma.user.update({ where: { id: user.id }, data: { isVerified: true } }),
    ]);

    return Response.json({ success: true, message: "Email сәтті расталды" });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ error: "Ішкі сервер қатесі" }, { status: 500 });
  }
}
