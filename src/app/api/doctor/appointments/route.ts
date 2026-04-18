import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireDoctor } from "@/lib/session";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { buildTimeSlots, combineDateAndTime, getDayKey, isTimeWithinWorkingHours, isWorkingDay } from "@/lib/scheduling";
import { z } from "zod";

const createDoctorAppointmentSchema = z.object({
  patientProfileId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  type: z.enum(["CONSULTATION", "CHECKUP", "TREATMENT", "EMERGENCY"]).default("CONSULTATION"),
  complaint: z.string().max(1000).optional(),
  notifyMessage: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const { user, doctorProfile } = await requireDoctor();
    await enforceMutationGuard(req, {
      key: "doctor_appointments_create",
      identity: doctorProfile.id,
      maxAttempts: 60,
      windowMs: 15 * 60 * 1000,
    });

    const body = await req.json();
    const parsed = createDoctorAppointmentSchema.parse(body);

    const patient = await prisma.patientProfile.findUnique({
      where: { id: parsed.patientProfileId },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!patient) {
      return Response.json({ error: "Пациент табылмады" }, { status: 404 });
    }

    const dateTime = combineDateAndTime(parsed.date, parsed.time);
    if (!dateTime || Number.isNaN(dateTime.getTime())) {
      return Response.json({ error: "Күн немесе уақыт қате" }, { status: 400 });
    }

    if (!isWorkingDay(doctorProfile.workDays, dateTime)) {
      return Response.json({ error: "Бұл күн сіздің жұмыс күніңіз емес" }, { status: 400 });
    }

    if (!isTimeWithinWorkingHours(parsed.time, doctorProfile.workHoursStart, doctorProfile.workHoursEnd, doctorProfile.slotDuration)) {
      return Response.json({ error: "Уақыт жұмыс сағатынан тыс" }, { status: 400 });
    }

    const availableSlots = buildTimeSlots(doctorProfile.workHoursStart, doctorProfile.workHoursEnd, doctorProfile.slotDuration);
    if (!availableSlots.includes(parsed.time)) {
      return Response.json({ error: "Таңдалған слот қолжетімсіз" }, { status: 400 });
    }

    if (dateTime.getTime() < new Date().getTime()) {
      return Response.json({ error: "Өткен уақытқа тіркеуге болмайды" }, { status: 400 });
    }

    const dayStart = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorProfile.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        dateTime: { gte: dayStart, lt: dayEnd },
      },
      select: { dateTime: true, duration: true },
    });

    const candidateStart = dateTime.getTime();
    const candidateEnd = candidateStart + doctorProfile.slotDuration * 60 * 1000;

    const hasConflict = existingAppointments.some((appointment) => {
      const existingStart = new Date(appointment.dateTime).getTime();
      const existingEnd = existingStart + appointment.duration * 60 * 1000;
      return existingStart < candidateEnd && existingEnd > candidateStart;
    });

    if (hasConflict) {
      return Response.json({ error: "Бұл уақытта қабылдау бар" }, { status: 400 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctorProfile.id,
          dateTime,
          duration: doctorProfile.slotDuration,
          type: parsed.type,
          complaint: parsed.complaint || null,
          status: "CONFIRMED",
        },
        select: {
          id: true,
          dateTime: true,
          type: true,
        },
      });

      await tx.appointmentSlot.create({
        data: {
          appointmentId: appointment.id,
          doctorId: doctorProfile.id,
          dateTime,
        },
      });

      return appointment;
    });

    const dateLabel = dateTime.toLocaleString("kk-KZ");
    const notifyBody = parsed.notifyMessage?.trim()
      ? `${parsed.notifyMessage.trim()} (${dateLabel})`
      : `Дәрігер ${user.name} сізге ${dateLabel} уақытына қабылдау тағайындады.`;

    await prisma.notification.create({
      data: {
        userId: patient.userId,
        title: "Жаңа қабылдау тағайындалды",
        body: notifyBody,
        type: "APPOINTMENT",
        link: "/patient/appointments",
      },
    });

    await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: patient.userId,
        content: notifyBody,
      },
    });

    return Response.json({
      success: true,
      appointment: created,
      day: getDayKey(dateTime),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "Бұл уақытта қабылдау бар" }, { status: 409 });
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
