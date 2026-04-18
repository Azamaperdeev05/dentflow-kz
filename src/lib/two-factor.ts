import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

function getIssuerName(): string {
  return process.env.TWO_FACTOR_ISSUER || "DentFlow KZ";
}

export function generateTwoFactorSecret(email: string): { secret: string; otpauthUrl: string; manualKey: string } {
  const secret = generateSecret();
  const otpauthUrl = generateURI({
    issuer: getIssuerName(),
    label: email,
    secret,
  });

  return {
    secret,
    otpauthUrl,
    manualKey: secret,
  };
}

export async function generateTwoFactorQrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 220,
  });
}

export async function verifyTwoFactorCode(secret: string, code: string): Promise<boolean> {
  const token = code.replace(/\s/g, "").trim();
  if (!/^\d{6}$/.test(token)) {
    return false;
  }

  try {
    const result = await verify({
      secret,
      token,
      epochTolerance: 30,
    });

    return Boolean(result.valid);
  } catch {
    return false;
  }
}
