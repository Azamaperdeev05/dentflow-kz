import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { encryptSecret } from "@/lib/secret-crypto";
import { generateTwoFactorQrDataUrl, generateTwoFactorSecret } from "@/lib/two-factor";

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    await enforceMutationGuard(req, {
      key: "two_factor_setup",
      identity: user.id,
      maxAttempts: 12,
      windowMs: 60 * 60 * 1000,
    });

    if (user.twoFactorEnabled) {
      return Response.json({ error: "2FA бұрыннан қосулы" }, { status: 400 });
    }

    const { secret, otpauthUrl, manualKey } = generateTwoFactorSecret(user.email);
    const qrDataUrl = await generateTwoFactorQrDataUrl(otpauthUrl);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorTempSecret: encryptSecret(secret),
      },
    });

    return Response.json({
      success: true,
      manualKey,
      qrDataUrl,
    });
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

    if (error instanceof Error && error.message === "ENCRYPTION_SECRET_MISSING") {
      return Response.json({ error: "Шифрлау кілті бапталмаған" }, { status: 500 });
    }

    return Response.json({ error: "Сервер қатесі" }, { status: 500 });
  }
}
