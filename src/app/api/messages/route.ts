import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireSessionUser();

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: user.id }, { receiverId: user.id }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
      take: 300,
    });

    const map = new Map<string, (typeof messages)[number]>();
    for (const message of messages) {
      const otherId = message.senderId === user.id ? message.receiverId : message.senderId;
      if (!map.has(otherId)) {
        map.set(otherId, message);
      }
    }

    const conversations = Array.from(map.values()).map((message) => {
      const otherUser = message.senderId === user.id ? message.receiver : message.sender;
      return {
        otherUser,
        lastMessage: message,
      };
    });

    return Response.json({ conversations });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
    }

    return Response.json({ error: "Сервер қатесі" }, { status: 500 });
  }
}
