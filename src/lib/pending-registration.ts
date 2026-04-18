import { prisma } from "@/lib/db";

type PendingRegistrationData = {
  email: string;
  name: string;
  phone: string | null;
  passwordHash: string;
  role: "PATIENT" | "DOCTOR";
  specialization: string | null;
  experience: number | null;
  licenseNumber: string | null;
  codeHash: string;
  expiresAt: Date;
  createdAt: Date;
};

async function cleanupExpiredPendingRegistrations(now = new Date()) {
  await prisma.pendingRegistration.deleteMany({
    where: { expiresAt: { lte: now } },
  });
}

export async function upsertPendingRegistration(data: PendingRegistrationData) {
  await cleanupExpiredPendingRegistrations();
  await prisma.pendingRegistration.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      phone: data.phone,
      passwordHash: data.passwordHash,
      role: data.role,
      specialization: data.specialization,
      experience: data.experience,
      licenseNumber: data.licenseNumber,
      codeHash: data.codeHash,
      expiresAt: data.expiresAt,
      createdAt: data.createdAt,
    },
    create: {
      email: data.email,
      name: data.name,
      phone: data.phone,
      passwordHash: data.passwordHash,
      role: data.role,
      specialization: data.specialization,
      experience: data.experience,
      licenseNumber: data.licenseNumber,
      codeHash: data.codeHash,
      expiresAt: data.expiresAt,
      createdAt: data.createdAt,
    },
  });
}

export async function getPendingRegistration(email: string): Promise<PendingRegistrationData | null> {
  await cleanupExpiredPendingRegistrations();
  const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
  if (!pending) {
    return null;
  }

  if (pending.expiresAt <= new Date()) {
    await prisma.pendingRegistration.delete({ where: { email } });
    return null;
  }

  return {
    email: pending.email,
    name: pending.name,
    phone: pending.phone,
    passwordHash: pending.passwordHash,
    role: pending.role as "PATIENT" | "DOCTOR",
    specialization: pending.specialization,
    experience: pending.experience,
    licenseNumber: pending.licenseNumber,
    codeHash: pending.codeHash,
    expiresAt: pending.expiresAt,
    createdAt: pending.createdAt,
  };
}

export async function clearPendingRegistration(email: string) {
  await prisma.pendingRegistration.deleteMany({ where: { email } });
}
