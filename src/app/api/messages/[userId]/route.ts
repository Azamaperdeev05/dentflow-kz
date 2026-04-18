import { getRequestMeta, logAccessDenied, logSecurityEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { canUsersChat } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { z } from "zod";
import { notifyUserChannels } from "@/lib/notification-dispatch";

const sendSchema = z.object({
  content: z.string().min(1).max(2000),
});

type Params = {
  params: {
    userId: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  try {
    const req = _;
    const user = await requireSessionUser();
    const requestMeta = getRequestMeta(req);

    const allowed = await canUsersChat(user.id, params.userId);
    if (!allowed) {
      await logAccessDenied({
        userId: user.id,
        userRole: user.role,
        action: "CHAT_VIEW_DENIED",
        resource: "MESSAGE",
        resourceId: params.userId,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
      });
      return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: user.id,
            receiverId: params.userId,
          },
          {
            senderId: params.userId,
            receiverId: user.id,
          },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    await prisma.message.updateMany({
      where: {
        senderId: params.userId,
        receiverId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    await logSecurityEvent({
      userId: user.id,
      userRole: user.role,
      eventType: "DATA_ACCESS",
      action: "CHAT_VIEW",
      resource: "MESSAGE",
      resourceId: params.userId,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      metadata: { count: messages.length },
    });

    return Response.json({ messages });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
    }

    return Response.json({ error: "Сервер қатесі" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const user = await requireSessionUser();
    const requestMeta = getRequestMeta(req);
    await enforceMutationGuard(req, {
      key: "messages_send",
      identity: `${user.id}_${params.userId}`,
      maxAttempts: 120,
      windowMs: 15 * 60 * 1000,
    });

    const allowed = await canUsersChat(user.id, params.userId);
    if (!allowed) {
      await logAccessDenied({
        userId: user.id,
        userRole: user.role,
        action: "CHAT_SEND_DENIED",
        resource: "MESSAGE",
        resourceId: params.userId,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
      });
      return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = sendSchema.parse(body);

    const receiver = await prisma.user.findUnique({ where: { id: params.userId }, select: { id: true, role: true } });
    if (!receiver) {
      return Response.json({ error: "Қолданушы табылмады" }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: params.userId,
        content: parsed.content,
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    await notifyUserChannels({
      userId: params.userId,
      title: "Жаңа чат хабарламасы",
      body: `${user.name}: ${parsed.content.slice(0, 80)}`,
      type: "MESSAGE",
      link: receiver.role === "DOCTOR" ? `/doctor/chat/${user.id}` : `/patient/chat/${user.id}`,
    });

    await logSecurityEvent({
      userId: user.id,
      userRole: user.role,
      eventType: "DATA_CHANGE",
      action: "CHAT_SEND",
      resource: "MESSAGE",
      resourceId: params.userId,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      metadata: { length: parsed.content.length },
    });

    return Response.json({ success: true, message });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
      return Response.json({ error: "Тым көп хабарлама жіберілді. Кейінірек қайталап көріңіз" }, { status: 429 });
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
