import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireDoctor } from "@/lib/session";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { getRequestMeta, logSecurityEvent } from "@/lib/audit-log";
import { parseWorkDays } from "@/lib/scheduling";

const timePattern = /^\d{2}:\d{2}$/;

const profileSchema = z.object({
  phone: z.string().trim().max(30).optional().nullable(),
  specializations: z.array(z.string().trim().min(1).max(80)).min(1),
  experience: z.number().int().min(0).max(80),
  licenseNumber: z.string().trim().max(100).optional().nullable(),
  education: z.string().trim().max(1000).optional().nullable(),
  about: z.string().trim().max(2000).optional().nullable(),
  isAvailable: z.boolean(),
  workDays: z.array(z.enum(["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"])).min(1),
  workHoursStart: z.string().regex(timePattern),
  workHoursEnd: z.string().regex(timePattern),
  slotDuration: z.number().int().min(10).max(180),
}).refine((data) => data.workHoursStart < data.workHoursEnd, {
  message: "Жұмыс уақыты дұрыс емес",
  path: ["workHoursEnd"],
});

export async function POST(req: Request) {
  try {
    const { user, doctorProfile } = await requireDoctor();
    const requestMeta = getRequestMeta(req);
    await enforceMutationGuard(req, {
      key: "doctor_profile_update",
      identity: doctorProfile.id,
      maxAttempts: 20,
      windowMs: 15 * 60 * 1000,
    });

    const body = await req.json();
    const parsed = profileSchema.parse(body);
    const normalizedSpecializations = parsed.specializations.map((item) => item.trim()).filter(Boolean);
    const normalizedWorkDays = parseWorkDays(JSON.stringify(parsed.workDays));

    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          phone: parsed.phone?.trim() || null,
        },
        select: {
          id: true,
          phone: true,
        },
      });

      const updatedDoctor = await tx.doctorProfile.update({
        where: { id: doctorProfile.id },
        data: {
          specializations: JSON.stringify(normalizedSpecializations),
          experience: parsed.experience,
          licenseNumber: parsed.licenseNumber?.trim() || null,
          education: parsed.education?.trim() || null,
          about: parsed.about?.trim() || null,
          isAvailable: parsed.isAvailable,
          workDays: JSON.stringify(normalizedWorkDays),
          workHoursStart: parsed.workHoursStart,
          workHoursEnd: parsed.workHoursEnd,
          slotDuration: parsed.slotDuration,
        },
      });

      return { updatedUser, updatedDoctor };
    });

    await logSecurityEvent({
      userId: user.id,
      userRole: user.role,
      eventType: "DATA_CHANGE",
      action: "DOCTOR_PROFILE_UPDATE",
      resource: "DOCTOR_PROFILE",
      resourceId: doctorProfile.id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      metadata: {
        phoneChanged: parsed.phone?.trim() !== (user.phone ?? null),
        specializationsCount: normalizedSpecializations.length,
        workDaysCount: normalizedWorkDays.length,
        isAvailable: parsed.isAvailable,
      },
    });

    return Response.json({
      success: true,
      doctorProfile: updated.updatedDoctor,
      user: updated.updatedUser,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CSRF_INVALID") {
      return Response.json({ error: "Қауіпсіздік қатесі" }, { status: 403 });
    }

    if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
      return Response.json({ error: "Сұраныс лимиті асты" }, { status: 429 });
    }

    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return Response.json({ error: "Валидация қатесі", details: error.flatten() }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return Response.json({ error: "Деректерді сақтау қатесі" }, { status: 500 });
    }

    return Response.json({ error: "Сервер қатесі" }, { status: 500 });
  }
}