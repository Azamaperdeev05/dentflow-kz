import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireDoctor } from "@/lib/session";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { z } from "zod";
import { notifyUserChannels } from "@/lib/notification-dispatch";

const schema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
});

type Params = {
  params: {
    appointmentId: string;
  };
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { doctorProfile } = await requireDoctor();
    await enforceMutationGuard(req, {
      key: "doctor_appointments_status_update",
      identity: doctorProfile.id,
      maxAttempts: 120,
      windowMs: 15 * 60 * 1000,
    });

    const body = await req.json();
    const parsed = schema.parse(body);

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      select: { id: true, doctorId: true, dateTime: true, patient: { select: { userId: true } } },
    });

    if (!appointment || appointment.doctorId !== doctorProfile.id) {
      return Response.json({ error: "Қабылдау табылмады" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.appointment.update({
        where: { id: appointment.id },
        data: { status: parsed.status },
      });

      if (parsed.status === "CANCELLED" || parsed.status === "COMPLETED") {
        await tx.appointmentSlot.deleteMany({
          where: { appointmentId: appointment.id },
        });
      } else {
        await tx.appointmentSlot.upsert({
          where: { appointmentId: appointment.id },
          update: {
            doctorId: appointment.doctorId,
            dateTime: appointment.dateTime,
          },
          create: {
            appointmentId: appointment.id,
            doctorId: appointment.doctorId,
            dateTime: appointment.dateTime,
          },
        });
      }

      return next;
    });

    await notifyUserChannels({
      userId: appointment.patient.userId,
      title: "Қабылдау статусы өзгерді",
      body: `Жаңа статус: ${parsed.status}`,
      type: "APPOINTMENT",
      link: "/patient/appointments",
    });

    return Response.json({ success: true, appointment: updated });
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
      return Response.json({ error: "Валидация қатесі" }, { status: 400 });
    }

    return Response.json({ error: "Сервер қатесі" }, { status: 500 });
  }
}
