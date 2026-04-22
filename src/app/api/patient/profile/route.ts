import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePatient } from "@/lib/session";
import { enforceMutationGuard } from "@/lib/mutation-guard";
import { getRequestMeta, logSecurityEvent } from "@/lib/audit-log";
import { bloodTypeOptions, kazakhstanRegions, allergyOptions, parseStringArray } from "@/lib/patient-profile-options";

const patientProfileSchema = z.object({
  birthDate: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE"]).optional().nullable(),
  region: z.enum(kazakhstanRegions).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  bloodType: z.enum(bloodTypeOptions).optional().nullable(),
  allergies: z.array(z.enum(allergyOptions)).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function GET() {
  try {
    const { patientProfile } = await requirePatient();
    return Response.json({
      patientProfile: {
        ...patientProfile,
        allergies: parseStringArray(patientProfile.allergies),
      },
    });
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
      key: "patient_profile_update",
      identity: patientProfile.id,
      maxAttempts: 20,
      windowMs: 15 * 60 * 1000,
    });

    const body = await req.json();
    const parsed = patientProfileSchema.parse(body);

    const updated = await prisma.patientProfile.update({
      where: { id: patientProfile.id },
      data: {
        birthDate: parsed.birthDate ? new Date(parsed.birthDate) : null,
        gender: parsed.gender ?? null,
        region: parsed.region ?? null,
        address: parsed.address?.trim() || null,
        bloodType: parsed.bloodType ?? null,
        allergies: parsed.allergies && parsed.allergies.length > 0 ? JSON.stringify(parsed.allergies) : null,
        notes: parsed.notes?.trim() || null,
      },
    });

    await logSecurityEvent({
      userId: user.id,
      userRole: user.role,
      eventType: "DATA_CHANGE",
      action: "PATIENT_PROFILE_UPDATE",
      resource: "PATIENT_PROFILE",
      resourceId: updated.id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      metadata: {
        hasBirthDate: Boolean(updated.birthDate),
        hasRegion: Boolean(updated.region),
        hasAddress: Boolean(updated.address),
      },
    });

    return Response.json({ success: true, patientProfile: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "CSRF_INVALID") {
      return Response.json({ error: "CSRF тексерісі өтпеді" }, { status: 403 });
    }

    if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
      return Response.json({ error: "Тым көп сұраныс. Кейінірек қайталап көріңіз" }, { status: 429 });
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
