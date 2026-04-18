import { getRequestMeta, logSecurityEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requirePatient } from "@/lib/session";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { z } from "zod";
import { combineDateAndTime, getAppointmentTypeDurationMinutes, isTimeWithinWorkingHours, isWorkingDay } from "@/lib/scheduling";
import { notifyUserChannels } from "@/lib/notification-dispatch";

const createAppointmentSchema = z.object({
  doctorProfileId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  dateTime: z.string().datetime().optional(),
  type: z.enum(["CONSULTATION", "CHECKUP", "TREATMENT", "EMERGENCY"]).default("CONSULTATION"),
  complaint: z.string().max(1000).optional(),
});

export async function GET() {
  try {
    const { user, patientProfile } = await requirePatient();

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patientProfile.id },
      include: {
        doctor: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { dateTime: "asc" },
    });

    await logSecurityEvent({
      userId: user.id,
      userRole: user.role,
      eventType: "DATA_ACCESS",
      action: "PATIENT_APPOINTMENTS_VIEW",
      resource: "APPOINTMENT",
      metadata: { count: appointments.length },
    });

    return Response.json({ appointments });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
    }

    return Response.json({ error: "Сервер қатесі" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user, patientProfile } = await requirePatient();
    const requestMeta = getRequestMeta(req);
    await enforceMutationGuard(req, {
      key: "appointments_create",
      identity: patientProfile.id,
      maxAttempts: 30,
      windowMs: 15 * 60 * 1000,
    });

    const body = await req.json();
    const parsed = createAppointmentSchema.parse(body);

    const requestedDateTime = parsed.date && parsed.time
      ? combineDateAndTime(parsed.date, parsed.time)
      : parsed.dateTime
      ? new Date(parsed.dateTime)
      : null;

    if (!requestedDateTime || Number.isNaN(requestedDateTime.getTime())) {
      return Response.json({ error: "Күн немесе уақыт қате" }, { status: 400 });
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: parsed.doctorProfileId },
      select: {
        id: true,
        isAvailable: true,
        slotDuration: true,
        workDays: true,
        workHoursStart: true,
        workHoursEnd: true,
      },
    });

    if (!doctor || !doctor.isAvailable) {
      return Response.json({ error: "Дәрігер қолжетімсіз" }, { status: 400 });
    }

    if (!isWorkingDay(doctor.workDays, requestedDateTime)) {
      return Response.json({ error: "Бұл күн дәрігердің жұмыс күні емес" }, { status: 400 });
    }

    if (!isTimeWithinWorkingHours(
      requestedDateTime.toTimeString().slice(0, 5),
      doctor.workHoursStart,
      doctor.workHoursEnd,
      doctor.slotDuration,
    )) {
      return Response.json({ error: "Таңдалған уақыт дәрігердің жұмыс сағатына сай емес" }, { status: 400 });
    }

    if (requestedDateTime.getTime() < new Date().getTime()) {
      return Response.json({ error: "Өткен уақытқа жазылуға болмайды" }, { status: 400 });
    }

    const dayStart = new Date(requestedDateTime.getFullYear(), requestedDateTime.getMonth(), requestedDateTime.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        dateTime: { gte: dayStart, lt: dayEnd },
      },
      select: { dateTime: true, duration: true },
    });

    const candidateStart = requestedDateTime.getTime();
    const appointmentDurationMinutes = getAppointmentTypeDurationMinutes(parsed.type, doctor.slotDuration);
    const candidateEnd = candidateStart + appointmentDurationMinutes * 60 * 1000;

    const hasConflict = existingAppointments.some((appointment) => {
      const existingStart = new Date(appointment.dateTime).getTime();
      const existingEnd = existingStart + appointment.duration * 60 * 1000;
      return existingStart < candidateEnd && existingEnd > candidateStart;
    });

    if (hasConflict) {
      return Response.json({ error: "Бұл уақытта дәрігер бос емес" }, { status: 400 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          patientId: patientProfile.id,
          doctorId: doctor.id,
          dateTime: requestedDateTime,
          duration: appointmentDurationMinutes,
          type: parsed.type,
          complaint: parsed.complaint || null,
        },
        include: {
          doctor: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
        },
      });

      await tx.appointmentSlot.create({
        data: {
          appointmentId: appointment.id,
          doctorId: doctor.id,
          dateTime: requestedDateTime,
        },
      });

      return appointment;
    });

    await notifyUserChannels({
      userId: created.doctor.user.id,
      title: "Жаңа қабылдау",
      body: `${created.doctor.user.name} үшін жаңа жазылу: ${new Date(created.dateTime).toLocaleString("kk-KZ")}`,
      type: "APPOINTMENT",
      link: "/doctor/schedule",
    });

    const patientUser = await prisma.user.findUnique({
      where: { id: patientProfile.userId },
      select: { id: true },
    });

    if (patientUser) {
      await notifyUserChannels({
        userId: patientUser.id,
        title: "Қабылдау сәтті тіркелді",
        body: `Сіз ${new Date(created.dateTime).toLocaleString("kk-KZ")} уақытына жазылдыңыз`,
        type: "APPOINTMENT",
        link: "/patient/appointments",
      });
    }

    await logSecurityEvent({
      userId: user.id,
      userRole: user.role,
      eventType: "DATA_CHANGE",
      action: "PATIENT_APPOINTMENT_CREATE",
      resource: "APPOINTMENT",
      resourceId: created.id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      metadata: {
        doctorId: created.doctor.id,
        type: created.type,
      },
    });

    return Response.json({ success: true, appointment: created });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "Бұл уақытта дәрігер бос емес" }, { status: 409 });
    }

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
      return Response.json({ error: "Валидация қатесі", details: error.flatten() }, { status: 400 });
    }

    return Response.json({ error: "Сервер қатесі" }, { status: 500 });
  }
}
