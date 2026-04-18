/**
 * File upload utilities for medical files (X-rays, photos, documents)
 */

export type MedicalFileType = "PHOTO" | "XRAY" | "DOCUMENT";

const MAX_FILE_SIZE_BY_TYPE: Record<MedicalFileType, number> = {
  PHOTO: 8 * 1024 * 1024, // 8MB
  XRAY: 12 * 1024 * 1024, // 12MB
  DOCUMENT: 5 * 1024 * 1024, // 5MB
};

const ALLOWED_TYPES: Record<MedicalFileType, string[]> = {
  PHOTO: ["image/jpeg", "image/png", "image/webp"],
  XRAY: ["image/jpeg", "image/png", "image/dicom"],
  DOCUMENT: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

function startsWithBytes(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) {
    return false;
  }

  return signature.every((value, index) => bytes[index] === value);
}

function isWebpSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 12) {
    return false;
  }

  const riff = startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]);
  const webp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return riff && webp;
}

function isDicomSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 132) {
    return false;
  }

  return bytes[128] === 0x44 && bytes[129] === 0x49 && bytes[130] === 0x43 && bytes[131] === 0x4d;
}

export function validateFileSignature(file: File, type: MedicalFileType, bytes: Uint8Array): { valid: boolean; error?: string } {
  const isJpeg = startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
  const isPng = startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const isPdf = startsWithBytes(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
  const isDoc = startsWithBytes(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  const isZip = startsWithBytes(bytes, [0x50, 0x4b, 0x03, 0x04]);
  const lowerName = file.name.toLowerCase();

  if (type === "PHOTO") {
    if (!(isJpeg || isPng || isWebpSignature(bytes))) {
      return { valid: false, error: "Файл мазмұны PHOTO түріне сәйкес емес" };
    }
    return { valid: true };
  }

  if (type === "XRAY") {
    if (!(isJpeg || isPng || isDicomSignature(bytes))) {
      return { valid: false, error: "Файл мазмұны XRAY түріне сәйкес емес" };
    }
    return { valid: true };
  }

  const isDocx = isZip && lowerName.endsWith(".docx");
  if (!(isPdf || isDoc || isDocx)) {
    return { valid: false, error: "Файл мазмұны DOCUMENT түріне сәйкес емес" };
  }

  return { valid: true };
}

export function validateFile(file: File, type: MedicalFileType): { valid: boolean; error?: string } {
  if (!file.name || file.name.length > 140) {
    return { valid: false, error: "Файл атауы бос болмауы керек және 140 таңбадан аспауы керек" };
  }

  if (file.size <= 0) {
    return { valid: false, error: "Бос файл жүктеуге болмайды" };
  }

  // Check file size
  const maxFileSize = MAX_FILE_SIZE_BY_TYPE[type];
  if (file.size > maxFileSize) {
    return {
      valid: false,
      error: `Файл өлшемі ${(maxFileSize / 1024 / 1024).toFixed(0)}MB-дан аспауы керек. Ағымды: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // Check file type
  const allowedMimes = ALLOWED_TYPES[type];
  if (!allowedMimes.includes(file.type)) {
    return { valid: false, error: `Рұқсатсыз файл түрі. Рұқсатты түрлер: ${allowedMimes.join(", ")}` };
  }

  return { valid: true };
}

export function generateFileKey(patientId: string, fileName: string, timestamp: number): string {
  // Create a unique key for file storage
  // Format: patients/{patientId}/{timestamp}-{filename}
  return `patients/${patientId}/${timestamp}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
}

export async function uploadFileToStorage(
  file: File,
  patientId: string,
  fileType: MedicalFileType
): Promise<{ url: string; error?: string }> {
  const validation = validateFile(file, fileType);
  if (!validation.valid) {
    return { url: "", error: validation.error };
  }

  // For development, we'll use a local storage approach
  // In production, this would upload to Vercel Blob, S3, or similar
  const formData = new FormData();
  formData.append("file", file);
  formData.append("patientId", patientId);
  formData.append("fileType", fileType);

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      return { url: "", error: data.error ?? "Жүктеу қатесі" };
    }

    const data = (await res.json()) as { url: string };
    return { url: data.url };
  } catch (error) {
    return { url: "", error: "Жүктеу қатесі" };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Get file icon based on type
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("word")) return "📝";
  return "📎";
}
