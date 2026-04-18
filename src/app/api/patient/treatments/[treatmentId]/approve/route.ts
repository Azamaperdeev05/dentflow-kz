import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePatient } from "@/lib/session";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { parseTreatmentMeta, stringifyTreatmentMeta } from "@/lib/treatment-plan";

type Params = {
  params: {
    treatmentId: string;
  };
};

const schema = z.object({
  approved: z.boolean().default(true),
});

export async function POST(req: Request, { params }: Params) {
  try {
    const { patientProfile } = await requirePatient();
    await enforceMutationGuard(req, {
      key: "patient_treatment_approve",
      identity: patientProfile.id,
      maxAttempts: 30,
      windowMs: 15 * 60 * 1000,
    });

    const body = await req.json();
    const parsed = schema.parse(body);

    const treatment = await prisma.treatment.findUnique({
      where: { id: params.treatmentId },
      select: {
        id: true,
        patientId: true,
        notes: true,
      },
    });

    if (!treatment || treatment.patientId !== patientProfile.id) {
      return Response.json({ error: "Емдеу жоспары табылмады" }, { status: 404 });
    }

    const meta = parseTreatmentMeta(treatment.notes);
    const nextMeta = {
      ...meta,
      approvedByPatient: parsed.approved,
      approvedAt: parsed.approved ? new Date().toISOString() : undefined,
    };

    const updated = await prisma.treatment.update({
      where: { id: treatment.id },
      data: {
        notes: stringifyTreatmentMeta(nextMeta),
      },
      select: {
        id: true,
        notes: true,
      },
    });

    return Response.json({ success: true, treatment: updated });
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
      return Response.json({ error: "Валидация қатесі", details: error.flatten() }, { status: 400 });
    }

    return Response.json({ error: "Сервер қатесі" }, { status: 500 });
  }
}
