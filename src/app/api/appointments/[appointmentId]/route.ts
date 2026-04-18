import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getRequestMeta, logSecurityEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { requirePatient } from "@/lib/session";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { getAppointmentTypeDurationMinutes, isTimeWithinWorkingHours, isWorkingDay } from "@/lib/scheduling";
import { notifyUserChannels } from "@/lib/notification-dispatch";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("CANCEL"),
  }),
  z.object({
    action: z.literal("RESCHEDULE"),
    dateTime: z.string().datetime(),
  }),
]);

type Params = {
  params: {
    appointmentId: string;
  };
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { user, patientProfile } = await requirePatient();
    const requestMeta = getRequestMeta(req);
    await enforceMutationGuard(req, {
      key: "patient_appointments_manage",
      identity: patientProfile.id,
      maxAttempts: 40,
      windowMs: 15 * 60 * 1000,
    });

    const body = await req.json();
    const parsed = schema.parse(body);

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      select: {
        id: true,
        patientId: true,
        doctorId: true,
        dateTime: true,
        duration: true,
        type: true,
        status: true,
      },
    });

    if (!appointment || appointment.patientId !== patientProfile.id) {
      return Response.json({ error: "Қабылдау табылмады" }, { status: 404 });
    }

    if (appointment.status === "COMPLETED") {
      return Response.json({ error: "Аяқталған қабылдауды өзгерту мүмкін емес" }, { status: 400 });
    }

    if (parsed.action === "CANCEL") {
      const updated = await prisma.$transaction(async (tx) => {
        const next = await tx.appointment.update({
          where: { id: appointment.id },
          data: { status: "CANCELLED" },
        });

        await tx.appointmentSlot.deleteMany({
          where: { appointmentId: appointment.id },
        });

        return next;
      });

      await notifyUserChannels({
        userId: user.id,
        title: "Қабылдау жойылды",
        body: "Сіздің қабылдауыңыз бас тартылды.",
        type: "APPOINTMENT",
        link: "/patient/appointments",
      });

      const doctorUser = await prisma.doctorProfile.findUnique({
        where: { id: appointment.doctorId },
        select: { userId: true },
      });

      if (doctorUser) {
        await notifyUserChannels({
          userId: doctorUser.userId,
          title: "Қабылдау бас тартылды",
          body: "Пациент қабылдаудан бас тартты.",
          type: "APPOINTMENT",
          link: "/doctor/schedule",
        });
      }

      await logSecurityEvent({
        userId: user.id,
        userRole: user.role,
        eventType: "DATA_CHANGE",
        action: "PATIENT_APPOINTMENT_CANCEL",
        resource: "APPOINTMENT",
        resourceId: appointment.id,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
      });

      return Response.json({ success: true, appointment: updated });
    }

    const requestedDateTime = new Date(parsed.dateTime);
    if (Number.isNaN(requestedDateTime.getTime()) || requestedDateTime.getTime() <= Date.now()) {
      return Response.json({ error: "Өткен немесе қате уақыт" }, { status: 400 });
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: appointment.doctorId },
      select: {
        id: true,
        isAvailable: true,
        slotDuration: true,
        workDays: true,
        workHoursStart: true,
        workHoursEnd: true,
        userId: true,
        user: { select: { name: true } },
      },
    });

    if (!doctor || !doctor.isAvailable) {
      return Response.json({ error: "Дәрігер қолжетімсіз" }, { status: 400 });
    }

    if (!isWorkingDay(doctor.workDays, requestedDateTime)) {
      return Response.json({ error: "Бұл күн дәрігердің жұмыс күні емес" }, { status: 400 });
    }

    const requestedTime = requestedDateTime.toTimeString().slice(0, 5);
    const appointmentDurationMinutes = getAppointmentTypeDurationMinutes(appointment.type, doctor.slotDuration);
    if (!isTimeWithinWorkingHours(requestedTime, doctor.workHoursStart, doctor.workHoursEnd, appointmentDurationMinutes)) {
      return Response.json({ error: "Таңдалған уақыт дәрігердің жұмыс сағатына сай емес" }, { status: 400 });
    }

    const dayStart = new Date(requestedDateTime.getFullYear(), requestedDateTime.getMonth(), requestedDateTime.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        dateTime: { gte: dayStart, lt: dayEnd },
        NOT: { id: appointment.id },
      },
      select: { dateTime: true, duration: true },
    });

    const candidateStart = requestedDateTime.getTime();
    const candidateEnd = candidateStart + appointmentDurationMinutes * 60 * 1000;

    const hasConflict = existingAppointments.some((item) => {
      const existingStart = new Date(item.dateTime).getTime();
      const existingEnd = existingStart + item.duration * 60 * 1000;
      return existingStart < candidateEnd && existingEnd > candidateStart;
    });

    if (hasConflict) {
      return Response.json({ error: "Бұл уақытта дәрігер бос емес" }, { status: 409 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          dateTime: requestedDateTime,
          duration: appointmentDurationMinutes,
          status: "PENDING",
        },
      });

      await tx.appointmentSlot.upsert({
        where: { appointmentId: appointment.id },
        update: {
          doctorId: doctor.id,
          dateTime: requestedDateTime,
        },
        create: {
          appointmentId: appointment.id,
          doctorId: doctor.id,
          dateTime: requestedDateTime,
        },
      });

      return next;
    });

    await notifyUserChannels({
      userId: doctor.userId,
      title: "Қабылдау ауыстырылды",
      body: `${user.name ?? "Пациент"} қабылдау уақытын ауыстырды: ${requestedDateTime.toLocaleString("kk-KZ")}`,
      type: "APPOINTMENT",
      link: "/doctor/schedule",
    });

    await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: doctor.userId,
        content: `${user.name} қабылдауын ауыстырды: ${requestedDateTime.toLocaleString("kk-KZ")}`,
      },
    });

    await logSecurityEvent({
      userId: user.id,
      userRole: user.role,
      eventType: "DATA_CHANGE",
      action: "PATIENT_APPOINTMENT_RESCHEDULE",
      resource: "APPOINTMENT",
      resourceId: appointment.id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      metadata: {
        newDateTime: requestedDateTime.toISOString(),
      },
    });

    return Response.json({ success: true, appointment: updated });
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
