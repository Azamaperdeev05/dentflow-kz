import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashResetCode } from "@/lib/password-reset";
import { resetPasswordSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    
    // Rate limit: 10 attempts per 1 hour for reset password
    if (!(await rateLimit(`reset_${clientIp}`, 10, 60 * 60 * 1000))) {
      return Response.json(
        { error: "Тым көп талапты ұсындыңыз. 1 сағат сайын қайта көңіл бөріңіз" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, code, password } = resetPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return Response.json({ error: "Email немесе код қате" }, { status: 400 });
    }

    const codeHash = hashResetCode(code);
    const now = new Date();

    const resetRequest = await prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        code: codeHash,
        used: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!resetRequest) {
      return Response.json({ error: "Код жарамсыз немесе мерзімі өтіп кеткен" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 14);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: resetRequest.id },
        data: { used: true },
      }),
    ]);

    return Response.json({ success: true, message: "Құпия сөз жаңартылды" });
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
