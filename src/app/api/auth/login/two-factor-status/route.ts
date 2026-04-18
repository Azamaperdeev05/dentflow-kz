import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { sanitizeEmail } from "@/lib/sanitize";
import { loginSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
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
        password: true,
        isVerified: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return Response.json({ error: "Email немесе құпиясөз қате" }, { status: 401 });
    }

    const isValidPassword = await compare(parsed.password, user.password);
    if (!isValidPassword) {
      return Response.json({ error: "Email немесе құпиясөз қате" }, { status: 401 });
    }

    if (!user.isVerified) {
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
