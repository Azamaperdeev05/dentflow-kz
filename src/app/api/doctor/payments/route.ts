import { prisma } from "@/lib/db";
import { requireDoctor } from "@/lib/session";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { z } from "zod";

const schema = z.object({
  treatmentId: z.string().min(1),
  amount: z.number().min(0),
  method: z.enum(["CASH", "CARD", "TRANSFER"]).default("CASH"),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { doctorProfile } = await requireDoctor();
    await enforceMutationGuard(req, {
      key: "doctor_payments_create",
      identity: doctorProfile.id,
      maxAttempts: 50,
      windowMs: 15 * 60 * 1000,
    });

    const body = await req.json();
    const parsed = schema.parse(body);

    const treatment = await prisma.treatment.findUnique({
      where: { id: parsed.treatmentId },
      include: { appointment: true },
    });

    if (!treatment || !treatment.appointment || treatment.appointment.doctorId !== doctorProfile.id) {
      return Response.json({ error: "Емдеу табылмады" }, { status: 404 });
    }

    const payment = await prisma.payment.create({
      data: {
        treatmentId: parsed.treatmentId,
        amount: parsed.amount,
        method: parsed.method,
        note: parsed.note || null,
      },
    });

    await prisma.treatment.update({
      where: { id: parsed.treatmentId },
      data: { paidAmount: { increment: parsed.amount } },
    });

    return Response.json({ success: true, payment });
  } catch (error) {
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
