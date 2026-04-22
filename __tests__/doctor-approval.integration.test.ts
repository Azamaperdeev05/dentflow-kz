import { execSync } from "node:child_process";
import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async () => undefined),
}));

vi.mock("@/lib/sms", () => ({
  sendSms: vi.fn(async () => undefined),
}));

vi.mock("@/lib/password-reset", async () => {
  const actual = await vi.importActual<typeof import("@/lib/password-reset")>("@/lib/password-reset");
  return { ...actual, generateResetCode: () => "123456" };
});

const sessionState: { userId: string | null } = { userId: null };

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => {
    if (!sessionState.userId) return null;
    return { user: { id: sessionState.userId } };
  }),
}));

type PostHandler = (req: Request) => Promise<Response>;
type PostHandlerWithParams = (req: Request, ctx: { params: Promise<{ userId: string }> }) => Promise<Response>;

let prisma: PrismaClient;
let registerPost: PostHandler;
let registerVerifyPost: PostHandler;
let approvePost: PostHandlerWithParams;
let rejectPost: PostHandlerWithParams;

function createMutationRequest(url: string, body: unknown, ip = "127.0.0.1") {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      "x-real-ip": ip,
    },
    body: JSON.stringify(body),
  });
}

async function clearDatabase(client: PrismaClient) {
  await client.loginOtp.deleteMany();
  await client.passwordReset.deleteMany();
  await client.notification.deleteMany();
  await client.message.deleteMany();
  await client.payment.deleteMany();
  await client.treatment.deleteMany();
  await client.appointmentSlot.deleteMany();
  await client.appointment.deleteMany();
  await client.medicalFile.deleteMany();
  await client.patientProfile.deleteMany();
  await client.doctorProfile.deleteMany();
  await client.user.deleteMany();
  await client.pendingRegistration.deleteMany();
  await client.rateLimitAttempt.deleteMany();
}

beforeAll(async () => {
  execSync("npx prisma db push --force-reset --skip-generate", {
    stdio: "pipe",
    env: process.env,
  });

  ({ prisma } = await import("@/lib/db"));
  ({ POST: registerPost } = await import("@/app/api/auth/register/route"));
  ({ POST: registerVerifyPost } = await import("@/app/api/auth/register/verify/route"));
  ({ POST: approvePost } = await import("@/app/api/admin/doctors/[userId]/approve/route"));
  ({ POST: rejectPost } = await import("@/app/api/admin/doctors/[userId]/reject/route"));
});

beforeEach(async () => {
  sessionState.userId = null;
  await clearDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function createAdminUser() {
  const admin = await prisma.user.create({
    data: {
      email: "admin@dent.kz",
      password: "hash",
      role: "ADMIN",
      name: "Admin",
      isVerified: true,
      twoFactorEnabled: true,
    },
  });
  sessionState.userId = admin.id;
  return admin;
}

async function createPendingDoctor(email = "doctor.pending@dent.kz") {
  return prisma.user.create({
    data: {
      email,
      password: "hash",
      role: "DOCTOR",
      name: "Dr Pending",
      isVerified: true,
      doctorApprovalStatus: "PENDING",
      doctorProfile: {
        create: {
          specializations: JSON.stringify(["Жалпы стоматология"]),
          experience: 3,
          licenseNumber: "LIC-001",
        },
      },
    },
  });
}

describe("Doctor approval flow — integration", () => {
  describe("POST /api/admin/doctors/[userId]/approve", () => {
    it("approves a PENDING doctor and creates notification", async () => {
      await createAdminUser();
      const doctor = await createPendingDoctor();

      const response = await approvePost(
        createMutationRequest(`http://localhost/api/admin/doctors/${doctor.id}/approve`, {}),
        { params: Promise.resolve({ userId: doctor.id }) },
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as { success?: boolean };
      expect(data.success).toBe(true);

      const updated = await prisma.user.findUnique({ where: { id: doctor.id } });
      expect(updated?.doctorApprovalStatus).toBe("APPROVED");

      const notification = await prisma.notification.findFirst({ where: { userId: doctor.id } });
      expect(notification).not.toBeNull();
      expect(notification?.type).toBe("SUCCESS");
    });

    it("returns 403 when called without admin session", async () => {
      sessionState.userId = null;
      const doctor = await createPendingDoctor();

      const response = await approvePost(
        createMutationRequest(`http://localhost/api/admin/doctors/${doctor.id}/approve`, {}),
        { params: Promise.resolve({ userId: doctor.id }) },
      );

      expect(response.status).toBe(403);
    });

    it("returns 404 for non-existent userId", async () => {
      await createAdminUser();

      const response = await approvePost(
        createMutationRequest("http://localhost/api/admin/doctors/nonexistent/approve", {}),
        { params: Promise.resolve({ userId: "nonexistent" }) },
      );

      expect(response.status).toBe(404);
    });

    it("returns 409 when doctor is already APPROVED", async () => {
      await createAdminUser();
      const doctor = await prisma.user.create({
        data: {
          email: "doctor.approved@dent.kz",
          password: "hash",
          role: "DOCTOR",
          name: "Dr Approved",
          isVerified: true,
          doctorApprovalStatus: "APPROVED",
          doctorProfile: { create: { specializations: "[]" } },
        },
      });

      const response = await approvePost(
        createMutationRequest(`http://localhost/api/admin/doctors/${doctor.id}/approve`, {}),
        { params: Promise.resolve({ userId: doctor.id }) },
      );

      expect(response.status).toBe(409);
    });
  });

  describe("POST /api/admin/doctors/[userId]/reject", () => {
    it("rejects a PENDING doctor with reason and creates notification", async () => {
      await createAdminUser();
      const doctor = await createPendingDoctor();

      const response = await rejectPost(
        createMutationRequest(`http://localhost/api/admin/doctors/${doctor.id}/reject`, {
          reason: "Лицензия деректері толық емес",
        }),
        { params: Promise.resolve({ userId: doctor.id }) },
      );

      expect(response.status).toBe(200);

      const updated = await prisma.user.findUnique({ where: { id: doctor.id } });
      expect(updated?.doctorApprovalStatus).toBe("REJECTED");

      const notification = await prisma.notification.findFirst({ where: { userId: doctor.id } });
      expect(notification).not.toBeNull();
      expect(notification?.type).toBe("ERROR");
      expect(notification?.body).toContain("Лицензия деректері толық емес");
    });

    it("rejects a PENDING doctor without reason", async () => {
      await createAdminUser();
      const doctor = await createPendingDoctor("doctor.noreject@dent.kz");

      const response = await rejectPost(
        createMutationRequest(`http://localhost/api/admin/doctors/${doctor.id}/reject`, {}),
        { params: Promise.resolve({ userId: doctor.id }) },
      );

      expect(response.status).toBe(200);
      const updated = await prisma.user.findUnique({ where: { id: doctor.id } });
      expect(updated?.doctorApprovalStatus).toBe("REJECTED");
    });

    it("returns 403 when called without admin session", async () => {
      sessionState.userId = null;
      const doctor = await createPendingDoctor();

      const response = await rejectPost(
        createMutationRequest(`http://localhost/api/admin/doctors/${doctor.id}/reject`, {}),
        { params: Promise.resolve({ userId: doctor.id }) },
      );

      expect(response.status).toBe(403);
    });

    it("returns 409 when doctor is already REJECTED", async () => {
      await createAdminUser();
      const doctor = await prisma.user.create({
        data: {
          email: "doctor.alreadyrejected@dent.kz",
          password: "hash",
          role: "DOCTOR",
          name: "Dr Already Rejected",
          isVerified: true,
          doctorApprovalStatus: "REJECTED",
          doctorProfile: { create: { specializations: "[]" } },
        },
      });

      const response = await rejectPost(
        createMutationRequest(`http://localhost/api/admin/doctors/${doctor.id}/reject`, {}),
        { params: Promise.resolve({ userId: doctor.id }) },
      );

      expect(response.status).toBe(409);
    });
  });

  describe("Doctor registration creates PENDING status", () => {
    it("doctor email verification sets doctorApprovalStatus to PENDING", async () => {
      const registerResponse = await registerPost(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json", "x-real-ip": "20.20.20.1" },
          body: JSON.stringify({
            name: "New Doctor",
            email: "new.doctor@test.kz",
            phone: "+77001234567",
            password: "StrongPass1!",
            confirmPassword: "StrongPass1!",
            role: "DOCTOR",
            specializations: ["Жалпы стоматология"],
          }),
        }),
      );
      expect(registerResponse.status).toBe(200);

      const verifyResponse = await registerVerifyPost(
        new Request("http://localhost/api/auth/register/verify", {
          method: "POST",
          headers: { "content-type": "application/json", "x-real-ip": "20.20.20.2" },
          body: JSON.stringify({ email: "new.doctor@test.kz", code: "123456" }),
        }),
      );
      expect(verifyResponse.status).toBe(200);

      const user = await prisma.user.findUnique({ where: { email: "new.doctor@test.kz" } });
      expect(user?.doctorApprovalStatus).toBe("PENDING");
      expect(user?.isVerified).toBe(true);
    });

    it("patient email verification does NOT set doctorApprovalStatus", async () => {
      const registerResponse = await registerPost(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json", "x-real-ip": "20.20.20.3" },
          body: JSON.stringify({
            name: "New Patient",
            email: "new.patient@test.kz",
            phone: "+77001234567",
            password: "StrongPass1!",
            confirmPassword: "StrongPass1!",
            role: "PATIENT",
          }),
        }),
      );
      expect(registerResponse.status).toBe(200);

      const verifyResponse = await registerVerifyPost(
        new Request("http://localhost/api/auth/register/verify", {
          method: "POST",
          headers: { "content-type": "application/json", "x-real-ip": "20.20.20.4" },
          body: JSON.stringify({ email: "new.patient@test.kz", code: "123456" }),
        }),
      );
      expect(verifyResponse.status).toBe(200);

      const user = await prisma.user.findUnique({ where: { email: "new.patient@test.kz" } });
      expect(user?.doctorApprovalStatus).toBeNull();
    });
  });
});
