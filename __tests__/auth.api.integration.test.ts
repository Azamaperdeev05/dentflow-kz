import { execSync } from "node:child_process";
import { compare, hash } from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async () => undefined),
}));

vi.mock("@/lib/password-reset", async () => {
  const actual = await vi.importActual<typeof import("@/lib/password-reset")>("@/lib/password-reset");
  return {
    ...actual,
    generateResetCode: () => "123456",
  };
});

type PostHandler = (req: Request) => Promise<Response>;

let prisma: PrismaClient;
let registerPost: PostHandler;
let registerVerifyPost: PostHandler;
let loginOtpRequestPost: PostHandler;
let loginOtpVerifyPost: PostHandler;
let forgotPasswordPost: PostHandler;
let resetPasswordPost: PostHandler;

function createPostRequest(url: string, body: unknown, ip = "127.0.0.1") {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
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
  ({ POST: loginOtpRequestPost } = await import("@/app/api/auth/login-otp/request/route"));
  ({ POST: loginOtpVerifyPost } = await import("@/app/api/auth/login-otp/verify/route"));
  ({ POST: forgotPasswordPost } = await import("@/app/api/auth/forgot-password/route"));
  ({ POST: resetPasswordPost } = await import("@/app/api/auth/reset-password/route"));
});

beforeEach(async () => {
  await clearDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Auth API integration", () => {
  it("registers and verifies patient account end-to-end", async () => {
    const registerResponse = await registerPost(
      createPostRequest(
        "http://localhost/api/auth/register",
        {
          name: "Patient Test",
          email: "patient.flow@test.kz",
          phone: "+77001234567",
          password: "StrongPass1!",
          confirmPassword: "StrongPass1!",
          role: "PATIENT",
        },
        "10.10.10.1",
      ),
    );

    expect(registerResponse.status).toBe(200);
    const registerData = (await registerResponse.json()) as { success?: boolean; requiresVerification?: boolean };
    expect(registerData.success).toBe(true);
    expect(registerData.requiresVerification).toBe(true);

    const verifyResponse = await registerVerifyPost(
      createPostRequest(
        "http://localhost/api/auth/register/verify",
        {
          email: "patient.flow@test.kz",
          code: "123456",
        },
        "10.10.10.2",
      ),
    );

    expect(verifyResponse.status).toBe(200);
    const verifyData = (await verifyResponse.json()) as { success?: boolean };
    expect(verifyData.success).toBe(true);

    const user = await prisma.user.findUnique({
      where: { email: "patient.flow@test.kz" },
      include: { patientProfile: true },
    });

    expect(user).not.toBeNull();
    expect(user?.isVerified).toBe(true);
    expect(user?.patientProfile).not.toBeNull();
  });

  it("issues and verifies login OTP for verified user", async () => {
    const passwordHash = await hash("StrongPass1!", 14);
    await prisma.user.create({
      data: {
        name: "OTP User",
        email: "otp.user@test.kz",
        password: passwordHash,
        role: "PATIENT",
        isVerified: true,
        patientProfile: { create: {} },
      },
    });

    const requestOtpResponse = await loginOtpRequestPost(
      createPostRequest(
        "http://localhost/api/auth/login-otp/request",
        {
          email: "otp.user@test.kz",
          password: "StrongPass1!",
        },
        "10.10.10.3",
      ),
    );

    expect(requestOtpResponse.status).toBe(200);

    const verifyOtpResponse = await loginOtpVerifyPost(
      createPostRequest(
        "http://localhost/api/auth/login-otp/verify",
        {
          email: "otp.user@test.kz",
          code: "123456",
        },
        "10.10.10.4",
      ),
    );

    expect(verifyOtpResponse.status).toBe(200);
    const verifyOtpData = (await verifyOtpResponse.json()) as { success?: boolean };
    expect(verifyOtpData.success).toBe(true);

    const usedOtp = await prisma.loginOtp.findFirst({
      where: { user: { email: "otp.user@test.kz" } },
      orderBy: { createdAt: "desc" },
    });

    expect(usedOtp).not.toBeNull();
    expect(usedOtp?.used).toBe(true);
  });

  it("rejects registration verification with wrong code and keeps pending state", async () => {
    const email = "pending.verify@test.kz";

    const registerResponse = await registerPost(
      createPostRequest(
        "http://localhost/api/auth/register",
        {
          name: "Pending Verify",
          email,
          phone: "+77001234567",
          password: "StrongPass1!",
          confirmPassword: "StrongPass1!",
          role: "PATIENT",
        },
        "10.10.10.8",
      ),
    );
    expect(registerResponse.status).toBe(200);

    const wrongVerifyResponse = await registerVerifyPost(
      createPostRequest(
        "http://localhost/api/auth/register/verify",
        {
          email,
          code: "654321",
        },
        "10.10.10.8",
      ),
    );

    expect(wrongVerifyResponse.status).toBe(400);

    const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
    const user = await prisma.user.findUnique({ where: { email } });

    expect(pending).not.toBeNull();
    expect(user).toBeNull();
  });

  it("does not allow reused login OTP code", async () => {
    const passwordHash = await hash("StrongPass1!", 14);
    await prisma.user.create({
      data: {
        name: "OTP Reuse User",
        email: "otp.reuse@test.kz",
        password: passwordHash,
        role: "PATIENT",
        isVerified: true,
        patientProfile: { create: {} },
      },
    });

    const requestOtpResponse = await loginOtpRequestPost(
      createPostRequest(
        "http://localhost/api/auth/login-otp/request",
        {
          email: "otp.reuse@test.kz",
          password: "StrongPass1!",
        },
        "10.10.10.9",
      ),
    );
    expect(requestOtpResponse.status).toBe(200);

    const firstVerify = await loginOtpVerifyPost(
      createPostRequest(
        "http://localhost/api/auth/login-otp/verify",
        {
          email: "otp.reuse@test.kz",
          code: "123456",
        },
        "10.10.10.9",
      ),
    );
    expect(firstVerify.status).toBe(200);

    const secondVerify = await loginOtpVerifyPost(
      createPostRequest(
        "http://localhost/api/auth/login-otp/verify",
        {
          email: "otp.reuse@test.kz",
          code: "123456",
        },
        "10.10.10.9",
      ),
    );
    expect(secondVerify.status).toBe(400);
  });

  it("completes forgot/reset password flow", async () => {
    const initialPassword = "StrongPass1!";
    const newPassword = "NewStrongPass2!";
    const initialHash = await hash(initialPassword, 14);

    await prisma.user.create({
      data: {
        name: "Reset User",
        email: "reset.user@test.kz",
        password: initialHash,
        role: "PATIENT",
        isVerified: true,
        patientProfile: { create: {} },
      },
    });

    const forgotResponse = await forgotPasswordPost(
      createPostRequest(
        "http://localhost/api/auth/forgot-password",
        { email: "reset.user@test.kz" },
        "10.10.10.5",
      ),
    );
    expect(forgotResponse.status).toBe(200);

    const resetResponse = await resetPasswordPost(
      createPostRequest(
        "http://localhost/api/auth/reset-password",
        {
          email: "reset.user@test.kz",
          code: "123456",
          password: newPassword,
          confirmPassword: newPassword,
        },
        "10.10.10.6",
      ),
    );
    expect(resetResponse.status).toBe(200);

    const updatedUser = await prisma.user.findUnique({ where: { email: "reset.user@test.kz" } });
    expect(updatedUser).not.toBeNull();
    expect(await compare(newPassword, updatedUser!.password)).toBe(true);

    const usedReset = await prisma.passwordReset.findFirst({
      where: { user: { email: "reset.user@test.kz" } },
      orderBy: { createdAt: "desc" },
    });
    expect(usedReset?.used).toBe(true);
  });

  it("enforces register rate-limit across repeated calls", async () => {
    for (let i = 0; i < 5; i += 1) {
      const response = await registerPost(
        createPostRequest(
          "http://localhost/api/auth/register",
          {
            name: `Rate User ${i}`,
            email: `rate.${i}@test.kz`,
            phone: "+77001234567",
            password: "StrongPass1!",
            confirmPassword: "StrongPass1!",
            role: "PATIENT",
          },
          "10.10.10.7",
        ),
      );
      expect(response.status).toBe(200);
    }

    const blockedResponse = await registerPost(
      createPostRequest(
        "http://localhost/api/auth/register",
        {
          name: "Rate User Blocked",
          email: "rate.blocked@test.kz",
          phone: "+77001234567",
          password: "StrongPass1!",
          confirmPassword: "StrongPass1!",
          role: "PATIENT",
        },
        "10.10.10.7",
      ),
    );

    expect(blockedResponse.status).toBe(429);

    const bucket = await prisma.rateLimitAttempt.findUnique({
      where: { key: "register_10.10.10.7" },
    });
    expect(bucket).not.toBeNull();
    expect(bucket?.count).toBe(5);
  });
});
