import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { decryptSecret, encryptSecret } from "@/lib/secret-crypto";
import { verifyTwoFactorCode } from "@/lib/two-factor";

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, "Код 6 таңбалы болуы керек"),
});

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    await enforceMutationGuard(req, {
      key: "two_factor_enable",
      identity: user.id,
      maxAttempts: 20,
      windowMs: 60 * 60 * 1000,
    });

    if (user.twoFactorEnabled) {
      return Response.json({ error: "2FA бұрыннан қосулы" }, { status: 400 });
    }

    if (!user.twoFactorTempSecret) {
      return Response.json({ error: "Алдымен 2FA баптауын бастаңыз" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = schema.parse(body);

    const tempSecret = decryptSecret(user.twoFactorTempSecret);
    if (!tempSecret) {
      return Response.json({ error: "2FA уақытша кілтін оқу мүмкін емес" }, { status: 400 });
    }

    if (!(await verifyTwoFactorCode(tempSecret, parsed.code))) {
      return Response.json({ error: "Код қате" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptSecret(tempSecret),
        twoFactorTempSecret: null,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
      return Response.json({ error: "Тым көп әрекет. Кейінірек қайталап көріңіз" }, { status: 429 });
    }

    if (error instanceof Error && error.message === "CSRF_INVALID") {
      return Response.json({ error: "CSRF тексерісі өтпеді" }, { status: 403 });
    }

    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return Response.json({ error: "Код форматы қате" }, { status: 400 });
    }

    return Response.json({ error: "Сервер қатесі" }, { status: 500 });
  }
}
