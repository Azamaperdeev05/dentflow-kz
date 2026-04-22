import { logSecurityEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { notifyUserChannels } from "@/lib/notification-dispatch";
import { requireAdmin } from "@/lib/session";

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { user: adminUser } = await requireAdmin();
    await enforceMutationGuard(req, {
      key: "admin_doctor_approve",
      identity: adminUser.id,
      maxAttempts: 60,
      windowMs: 15 * 60 * 1000,
    });

    const { userId } = await params;

    const doctor = await prisma.user.findUnique({
      where: { id: userId, role: "DOCTOR" },
      select: { id: true, name: true, email: true, doctorApprovalStatus: true },
    });

    if (!doctor) {
      return Response.json({ error: "Дәрігер табылмады" }, { status: 404 });
    }

    if (doctor.doctorApprovalStatus === "APPROVED") {
      return Response.json({ error: "Дәрігер бұрыннан бекітілген" }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { doctorApprovalStatus: "APPROVED" },
    });

    await notifyUserChannels({
      userId: doctor.id,
      title: "Аккаунтыңыз бекітілді",
      body: "DentFlow KZ жүйесіне қош келдіңіз! Енді жүйеге кіре аласыз.",
      type: "SUCCESS",
      link: "/login",
    });

    await logSecurityEvent({
      userId: adminUser.id,
      userRole: adminUser.role,
      eventType: "ADMIN",
      action: "DOCTOR_APPROVED",
      resource: "USER",
      resourceId: userId,
      status: "SUCCESS",
      metadata: { doctorName: doctor.name, doctorEmail: doctor.email },
    });

    return Response.json({ success: true, message: "Дәрігер сәтті бекітілді" });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") return Response.json({ error: "Кіру талап етіледі" }, { status: 403 });
      if (error.message === "FORBIDDEN") return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
      if (error.message === "TWO_FACTOR_REQUIRED") return Response.json({ error: "2FA талап етіледі" }, { status: 403 });
      if (error.message === "RATE_LIMIT_EXCEEDED") return Response.json({ error: "Сұраныс лимиті асты" }, { status: 429 });
      if (error.message === "CSRF_INVALID") return Response.json({ error: "Қауіпсіздік қатесі" }, { status: 403 });
    }
    return Response.json({ error: "Ішкі сервер қатесі" }, { status: 500 });
  }
}
