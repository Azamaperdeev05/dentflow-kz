import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { z } from "zod";

const markReadSchema = z.object({
  ids: z.array(z.string().min(1)).max(50).optional(),
});

export async function GET() {
  try {
    const user = await requireSessionUser();

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return Response.json({ notifications });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
    }

    return Response.json({ error: "Сервер қатесі" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    await enforceMutationGuard(req, {
      key: "notifications_mark_read",
      identity: user.id,
      maxAttempts: 300,
      windowMs: 15 * 60 * 1000,
    });

    const body = await req.json();
    const parsed = markReadSchema.parse(body);

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
        ...(parsed.ids && parsed.ids.length > 0 ? { id: { in: parsed.ids } } : {}),
      },
      data: { isRead: true },
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
      return Response.json({ error: "Тым көп сұраныс. Кейінірек қайталап көріңіз" }, { status: 429 });
    }

    if (error instanceof Error && error.message === "CSRF_INVALID") {
      return Response.json({ error: "CSRF тексерісі өтпеді" }, { status: 403 });
    }

    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return Response.json({ error: "Валидация қатесі" }, { status: 400 });
    }

    return Response.json({ error: "Сервер қатесі" }, { status: 500 });
  }
}
