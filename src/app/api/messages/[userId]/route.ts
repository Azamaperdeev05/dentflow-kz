import { getRequestMeta, logAccessDenied, logSecurityEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { canUsersChat } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { z } from "zod";
import { notifyUserChannels } from "@/lib/notification-dispatch";
import { encryptSecret, decryptSecret } from "@/lib/secret-crypto";
import { debugLog } from "@/lib/debug-logger";

const sendSchema = z.object({
  content: z.string().max(2000).optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
}).refine(data => data.content || data.fileUrl, {
  message: "Хат мәтіні немесе файл болуы керек",
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

    const rawMessages = await prisma.message.findMany({
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

    const messages = rawMessages.map(msg => ({
      ...msg,
      content: msg.isEncrypted ? (decryptSecret(msg.content) || "[Шифрланған хабарлама]") : msg.content,
      fileUrl: msg.isEncrypted && msg.fileUrl ? (decryptSecret(msg.fileUrl) || msg.fileUrl) : msg.fileUrl,
    }));

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
    debugLog("GET messages failed", error);
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

    const contentType = req.headers.get("content-type") || "";
    let content = "";
    let fileUrl: string | undefined = undefined;
    let fileName: string | undefined = undefined;
    let fileType: string | undefined = undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      content = formData.get("content")?.toString() || "";
      const file = formData.get("file") as File | null;
      if (file) {
         const buffer = await file.arrayBuffer();
         const base64 = Buffer.from(buffer).toString("base64");
         fileType = file.type || "application/octet-stream";
         fileName = file.name;
         fileUrl = `data:${fileType};base64,${base64}`;
      }
      if (!content && !fileUrl) {
        return Response.json({ error: "Хат мәтіні немесе файл болуы керек" }, { status: 400 });
      }
    } else {
      const body = await req.json();
      const parsed = sendSchema.parse(body);
      content = parsed.content || "";
      fileUrl = parsed.fileUrl;
      fileName = parsed.fileName;
      fileType = parsed.fileType;
    }

    const receiver = await prisma.user.findUnique({ where: { id: params.userId }, select: { id: true, role: true } });
    if (!receiver) {
      return Response.json({ error: "Қолданушы табылмады" }, { status: 404 });
    }

    const encryptedContent = content ? encryptSecret(content) : "";
    const encryptedFileUrl = fileUrl ? encryptSecret(fileUrl) : undefined;

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: params.userId,
        content: encryptedContent,
        isEncrypted: true,
        fileUrl: encryptedFileUrl,
        fileName: fileName,
        fileType: fileType,
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    const displayContent = content || (fileName ? `Файл: ${fileName}` : "Файл жіберілді");
    
    // Set unencrypted values for the immediate response object (don't save to DB)
    message.content = content || ""; 
    if (message.fileUrl) {
       message.fileUrl = fileUrl || null;
    }

    await notifyUserChannels({
      userId: params.userId,
      title: "Жаңа чат хабарламасы",
      body: `${user.name}: ${displayContent.slice(0, 80)}`,
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
      metadata: { length: content?.length || 0, hasFile: !!fileUrl },
    });

    return Response.json({ success: true, message });
  } catch (error) {
    debugLog("POST message failed", error);
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
