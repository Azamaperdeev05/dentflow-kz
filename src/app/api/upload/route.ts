import { prisma } from "@/lib/db";
import { requirePatient } from "@/lib/session";
import { MedicalFileType, validateFile, validateFileSignature } from "@/lib/file-upload";
import { enforceMutationGuard } from "@/lib/mutation-guard";

const MEDICAL_FILE_TYPES: MedicalFileType[] = ["PHOTO", "XRAY", "DOCUMENT"];

function isMedicalFileType(value: string): value is MedicalFileType {
  return MEDICAL_FILE_TYPES.includes(value as MedicalFileType);
}

export async function POST(req: Request) {
  try {
    const { patientProfile } = await requirePatient();
    await enforceMutationGuard(req, {
      key: "upload_medical_file",
      identity: patientProfile.id,
      maxAttempts: 20,
      windowMs: 60 * 60 * 1000,
    });

    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const fileTypeRaw = formData.get("fileType");
    const fileType = typeof fileTypeRaw === "string" && isMedicalFileType(fileTypeRaw) ? fileTypeRaw : null;

    if (!file || !fileType) {
      return Response.json({ error: "Файл және түрі міндетті" }, { status: 400 });
    }

    const validation = validateFile(file, fileType);
    if (!validation.valid) {
      return Response.json({ error: validation.error ?? "Файл валидациядан өтпеді" }, { status: 400 });
    }

    // For development: use data URL (not recommended for production)
    const buffer = await file.arrayBuffer();
    const signatureBytes = new Uint8Array(buffer.slice(0, 512));
    const signatureCheck = validateFileSignature(file, fileType, signatureBytes);
    if (!signatureCheck.valid) {
      return Response.json({ error: signatureCheck.error ?? "Файл сигнатурасы жарамсыз" }, { status: 400 });
    }

    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Save file record to database
    const medicalFile = await prisma.medicalFile.create({
      data: {
        patientId: patientProfile.id,
        name: file.name,
        url: dataUrl,
        type: fileType,
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
