import { prisma } from "@/lib/db";

type RiskSignalInput = {
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  isSuccess: boolean;
};

type RiskAssessment = {
  score: number;
  suspicious: boolean;
  reasons: string[];
};

function normalizeIp(ipAddress?: string) {
  return ipAddress?.trim() || "unknown";
}

export function deriveDeviceFingerprint(userAgent?: string) {
  return (userAgent || "unknown").slice(0, 160);
}

function isNightHours(now = new Date()) {
  const hour = now.getHours();
  return hour >= 0 && hour < 6;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

function assessRisk(params: {
  failedAttempts: number;
  isNewDevice: boolean;
  isNight: boolean;
  success: boolean;
}): RiskAssessment {
  let score = 0;
  const reasons: string[] = [];

  if (params.isNewDevice) {
    score += 25;
    reasons.push("Жаңа құрылғы");
  }

  if (params.isNight) {
    score += 20;
    reasons.push("Түнгі уақытта кіру");
  }

  if (params.failedAttempts >= 3) {
    score += 20;
    reasons.push("Қате пароль әрекеттері >= 3");
  }

  if (params.failedAttempts >= 5) {
    score += 20;
    reasons.push("Қате пароль әрекеттері >= 5");
  }

  if (!params.success) {
    score += 15;
    reasons.push("Сәтсіз кіру");
  }

  const normalizedScore = clampScore(score);
  return {
    score: normalizedScore,
    suspicious: normalizedScore >= 60,
    reasons,
  };
}

export async function updateLoginRiskSignal(input: RiskSignalInput) {
  const ipAddress = normalizeIp(input.ipAddress);
  const deviceFingerprint = deriveDeviceFingerprint(input.userAgent);
  const key = `${input.email ?? "unknown"}:${ipAddress}:${deviceFingerprint}`;

  const existing = await prisma.loginRiskSignal.findUnique({
    where: { key },
    select: {
      id: true,
      failedAttempts: true,
      isSuspicious: true,
    },
  });

  const nextFailedAttempts = input.isSuccess
    ? 0
    : (existing?.failedAttempts ?? 0) + 1;

  const risk = assessRisk({
    failedAttempts: nextFailedAttempts,
    isNewDevice: !existing,
    isNight: isNightHours(),
    success: input.isSuccess,
  });

  const saved = await prisma.loginRiskSignal.upsert({
    where: { key },
    update: {
      userId: input.userId,
      email: input.email,
      ipAddress,
      userAgent: input.userAgent,
      deviceFingerprint,
      failedAttempts: nextFailedAttempts,
      lastAttemptAt: new Date(),
      lastSuccessAt: input.isSuccess ? new Date() : undefined,
      riskScore: risk.score,
      isSuspicious: risk.suspicious,
    },
    create: {
      key,
      userId: input.userId,
      email: input.email,
      ipAddress,
      userAgent: input.userAgent,
      deviceFingerprint,
      failedAttempts: nextFailedAttempts,
      lastSuccessAt: input.isSuccess ? new Date() : null,
      riskScore: risk.score,
      isSuspicious: risk.suspicious,
    },
    select: {
      riskScore: true,
      isSuspicious: true,
      failedAttempts: true,
    },
  });

  return {
    riskScore: saved.riskScore,
    isSuspicious: saved.isSuspicious,
    failedAttempts: saved.failedAttempts,
    reasons: risk.reasons,
  };
}
