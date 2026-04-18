import { prisma } from "@/lib/db";
import { requireDoctor } from "@/lib/session";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { z } from "zod";
import { stringifyTreatmentMeta, stringifyTreatmentStages, sumStageCosts } from "@/lib/treatment-plan";

const schema = z.object({
  patientProfileId: z.string().min(1),
  diagnosis: z.string().trim().min(1).default("Емдеу жоспары"),
  stages: z.array(z.object({
    title: z.string().trim().min(1),
    cost: z.number().min(0),
  })).min(1),
  totalCost: z.number().min(0).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).default("ACTIVE"),
});

export async function POST(req: Request) {
  try {
    const { doctorProfile } = await requireDoctor();
    await enforceMutationGuard(req, {
      key: "doctor_treatments_create",
      identity: doctorProfile.id,
      maxAttempts: 40,
      windowMs: 15 * 60 * 1000,
    });

    const body = await req.json();
    const parsed = schema.parse(body);
    const stages = parsed.stages.map((item, index) => ({
      id: `stage_${index + 1}`,
      title: item.title,
      cost: item.cost,
    }));
    const computedTotalCost = sumStageCosts(stages);
    const totalCost = parsed.totalCost ?? computedTotalCost;

    const lastAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: parsed.patientProfileId,
        doctorId: doctorProfile.id,
      },
      orderBy: { dateTime: "desc" },
      select: { id: true },
    });

    const treatment = await prisma.treatment.create({
      data: {
        patientId: parsed.patientProfileId,
        appointmentId: lastAppointment?.id ?? null,
        diagnosis: parsed.diagnosis,
        procedures: stringifyTreatmentStages(stages),
        totalCost,
        status: parsed.status,
        notes: stringifyTreatmentMeta({ approvedByPatient: false }),
      },
    });

    return Response.json({ success: true, treatment });
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
