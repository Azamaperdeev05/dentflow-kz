/**
 * File upload utilities for medical files.
 */

export type MedicalFileType = string;

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

function startsWithBytes(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) {
    return false;
  }

  return signature.every((value, index) => bytes[index] === value);
}

export function validateFileSignature(_file: File, _type: MedicalFileType, _bytes: Uint8Array): { valid: boolean; error?: string } {
  return { valid: true };
}

export function validateFile(file: File, type?: MedicalFileType): { valid: boolean; error?: string } {
  if (!file.name || file.name.length > 140) {
    return { valid: false, error: "Файл атауы бос болмауы керек және 140 таңбадан аспауы керек" };
  }

  if (file.size <= 0) {
    return { valid: false, error: "Бос файл жүктеуге болмайды" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Файл өлшемі ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB-дан аспауы керек. Ағымды: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
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
