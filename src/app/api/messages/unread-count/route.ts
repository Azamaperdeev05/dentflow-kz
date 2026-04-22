import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireSessionUser();

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: user.id,
        isRead: false,
      },
    });

    return Response.json({ unreadCount });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
    }

    return Response.json({ error: "Сервер қатесі" }, { status: 500 });
  }
}
