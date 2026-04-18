import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionSecret(): string {
  return (
    process.env.TWO_FACTOR_ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV !== "production" ? "dentflow-kz-dev-insecure-2fa-secret" : "")
  );
}

function getKey(): Buffer {
  const secret = getEncryptionSecret();
  if (!secret) {
    throw new Error("ENCRYPTION_SECRET_MISSING");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(cipherText: string | null | undefined): string | null {
  if (!cipherText) {
    return null;
  }

  try {
    const [ivPart, authTagPart, encryptedPart] = cipherText.split(".");
    if (!ivPart || !authTagPart || !encryptedPart) {
      return null;
    }

    const iv = Buffer.from(ivPart, "base64");
    const authTag = Buffer.from(authTagPart, "base64");
    const encrypted = Buffer.from(encryptedPart, "base64");

    const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}
