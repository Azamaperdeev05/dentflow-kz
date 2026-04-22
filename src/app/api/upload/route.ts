import { getRequestMeta, logSecurityEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { requirePatient } from "@/lib/session";
import { validateFile } from "@/lib/file-upload";
import { enforceMutationGuard } from "@/lib/mutation-guard";

export async function POST(req: Request) {
  try {
    const { user, patientProfile } = await requirePatient();
    const requestMeta = getRequestMeta(req);
    await enforceMutationGuard(req, {
      key: "upload_medical_file",
      identity: patientProfile.id,
      maxAttempts: 20,
      windowMs: 60 * 60 * 1000,
    });

    const formData = await req.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "Файл міндетті" }, { status: 400 });
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      return Response.json({ error: validation.error ?? "Файл валидациядан өтпеді" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();

    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = file.type || "application/octet-stream";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Save file record to database
    const medicalFile = await prisma.medicalFile.create({
      data: {
        patientId: patientProfile.id,
        name: file.name,
        url: dataUrl,
        type: mimeType,
        size: file.size,
      },
    });

    await logSecurityEvent({
      userId: user.id,
      userRole: user.role,
      eventType: "DATA_CHANGE",
      action: "PATIENT_FILE_UPLOAD",
      resource: "MEDICAL_FILE",
      resourceId: medicalFile.id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      metadata: {
        fileType: medicalFile.type,
        size: file.size,
      },
    });

    return Response.json({ url: medicalFile.url });
  } catch (error) {
    if (error instanceof Error && error.message === "CSRF_INVALID") {
      return Response.json({ error: "CSRF тексерісі өтпеді" }, { status: 403 });
    }

    if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
      return Response.json({ error: "Тым көп жүктеу әрекеті. Кейінірек қайталап көріңіз" }, { status: 429 });
    }

    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
    }

    console.error("Upload error:", error);
    return Response.json({ error: "Жүктеу қатесі" }, { status: 500 });
  }
}
