import { execSync } from "node:child_process";
import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const sessionState: { userId: string | null } = { userId: null };

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => {
    if (!sessionState.userId) {
      return null;
    }

    return {
      user: {
        id: sessionState.userId,
      },
    };
  }),
}));

type PostHandler = (req: Request) => Promise<Response>;
type PatchHandlerWithParams = (req: Request, ctx: { params: { appointmentId: string } }) => Promise<Response>;
type PostHandlerWithTreatmentParams = (req: Request, ctx: { params: { treatmentId: string } }) => Promise<Response>;
type PostHandlerWithUserParams = (req: Request, ctx: { params: { userId: string } }) => Promise<Response>;
type GetHandler = () => Promise<Response>;

let prisma: PrismaClient;
let appointmentsPost: PostHandler;
let appointmentManagePatch: PatchHandlerWithParams;
let doctorAppointmentPatch: PatchHandlerWithParams;
let treatmentsPost: PostHandler;
let paymentsPost: PostHandler;
let treatmentApprovePost: PostHandlerWithTreatmentParams;
let messagePost: PostHandlerWithUserParams;
let notificationsGet: GetHandler;

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

function createPatchRequest(url: string, body: unknown, ip = "127.0.0.1") {
  return new Request(url, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      "x-real-ip": ip,
    },
    body: JSON.stringify(body),
  });
}

function createNextWorkdayAt(hour: number, minute: number) {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  value.setHours(hour, minute, 0, 0);

  while (value.getDay() === 0 || value.getDay() === 6) {
    value.setDate(value.getDate() + 1);
  }

  return value;
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
  ({ POST: appointmentsPost } = await import("@/app/api/appointments/route"));
  ({ PATCH: appointmentManagePatch } = await import("@/app/api/appointments/[appointmentId]/route"));
  ({ PATCH: doctorAppointmentPatch } = await import("@/app/api/doctor/appointments/[appointmentId]/route"));
  ({ POST: treatmentsPost } = await import("@/app/api/doctor/treatments/route"));
  ({ POST: paymentsPost } = await import("@/app/api/doctor/payments/route"));
  ({ POST: treatmentApprovePost } = await import("@/app/api/patient/treatments/[treatmentId]/approve/route"));
  ({ POST: messagePost } = await import("@/app/api/messages/[userId]/route"));
  ({ GET: notificationsGet } = await import("@/app/api/notifications/route"));
});

beforeEach(async () => {
  sessionState.userId = null;
  await clearDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Core module integration", () => {
  it("covers patient booking, reschedule, cancel and doctor status update flow", async () => {
    const patientUser = await prisma.user.create({
      data: {
        email: "patient.flow@dent.kz",
        password: "hash",
        role: "PATIENT",
        name: "Patient Flow",
        isVerified: true,
        patientProfile: { create: {} },
      },
      include: { patientProfile: true },
    });

    const doctorUser = await prisma.user.create({
      data: {
        email: "doctor.flow@dent.kz",
        password: "hash",
        role: "DOCTOR",
        name: "Doctor Flow",
        isVerified: true,
        doctorProfile: {
          create: {
            specializations: JSON.stringify(["Therapist"]),
            isAvailable: true,
            workDays: JSON.stringify(["MON", "TUE", "WED", "THU", "FRI"]),
            workHoursStart: "09:00",
            workHoursEnd: "18:00",
            slotDuration: 30,
          },
        },
      },
      include: { doctorProfile: true },
    });

    const appointmentDate = createNextWorkdayAt(10, 0);

    sessionState.userId = patientUser.id;
    const createResponse = await appointmentsPost(
      createMutationRequest("http://localhost/api/appointments", {
        doctorProfileId: doctorUser.doctorProfile!.id,
        dateTime: appointmentDate.toISOString(),
        type: "CONSULTATION",
        complaint: "Tooth pain",
      }, "30.30.30.1"),
    );

    expect(createResponse.status).toBe(200);
    const createData = (await createResponse.json()) as { appointment?: { id: string } };
    const appointmentId = createData.appointment?.id;
    expect(appointmentId).toBeTruthy();

    const slotAfterCreate = await prisma.appointmentSlot.findUnique({ where: { appointmentId: appointmentId! } });
    expect(slotAfterCreate).not.toBeNull();

    const rescheduledDate = new Date(appointmentDate);
    rescheduledDate.setHours(11, 0, 0, 0);

    const rescheduleResponse = await appointmentManagePatch(
      createPatchRequest(
        `http://localhost/api/appointments/${appointmentId}`,
        { action: "RESCHEDULE", dateTime: rescheduledDate.toISOString() },
        "30.30.30.2",
      ),
      { params: { appointmentId: appointmentId! } },
    );

    expect(rescheduleResponse.status).toBe(200);

    const appointmentAfterReschedule = await prisma.appointment.findUnique({ where: { id: appointmentId! } });
    expect(appointmentAfterReschedule?.dateTime.toISOString()).toBe(rescheduledDate.toISOString());

    sessionState.userId = doctorUser.id;
    const doctorConfirmResponse = await doctorAppointmentPatch(
      createPatchRequest(
        `http://localhost/api/doctor/appointments/${appointmentId}`,
        { status: "CONFIRMED" },
        "30.30.30.3",
      ),
      { params: { appointmentId: appointmentId! } },
    );
    expect(doctorConfirmResponse.status).toBe(200);

    sessionState.userId = patientUser.id;
    const cancelResponse = await appointmentManagePatch(
      createPatchRequest(
        `http://localhost/api/appointments/${appointmentId}`,
        { action: "CANCEL" },
        "30.30.30.4",
      ),
      { params: { appointmentId: appointmentId! } },
    );

    expect(cancelResponse.status).toBe(200);

    const appointmentAfterCancel = await prisma.appointment.findUnique({ where: { id: appointmentId! } });
    expect(appointmentAfterCancel?.status).toBe("CANCELLED");

    const slotAfterCancel = await prisma.appointmentSlot.findUnique({ where: { appointmentId: appointmentId! } });
    expect(slotAfterCancel).toBeNull();

    const doctorNotifications = await prisma.notification.findMany({ where: { userId: doctorUser.id } });
    const patientNotifications = await prisma.notification.findMany({ where: { userId: patientUser.id } });
    expect(doctorNotifications.length).toBeGreaterThan(0);
    expect(patientNotifications.length).toBeGreaterThan(0);
  });

  it("covers treatment staging, patient approval and payment accounting", async () => {
    const patientUser = await prisma.user.create({
      data: {
        email: "patient.treatment@dent.kz",
        password: "hash",
        role: "PATIENT",
        name: "Patient Treatment",
        isVerified: true,
        patientProfile: { create: {} },
      },
      include: { patientProfile: true },
    });

    const doctorUser = await prisma.user.create({
      data: {
        email: "doctor.treatment@dent.kz",
        password: "hash",
        role: "DOCTOR",
        name: "Doctor Treatment",
        isVerified: true,
        doctorProfile: {
          create: {
            specializations: JSON.stringify(["Orthodontist"]),
            isAvailable: true,
            workDays: JSON.stringify(["MON", "TUE", "WED", "THU", "FRI"]),
          },
        },
      },
      include: { doctorProfile: true },
    });

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patientUser.patientProfile!.id,
        doctorId: doctorUser.doctorProfile!.id,
        dateTime: createNextWorkdayAt(14, 0),
        duration: 30,
        status: "CONFIRMED",
        type: "CONSULTATION",
      },
    });

    await prisma.appointmentSlot.create({
      data: {
        appointmentId: appointment.id,
        doctorId: doctorUser.doctorProfile!.id,
        dateTime: appointment.dateTime,
      },
    });

    sessionState.userId = doctorUser.id;
    const treatmentResponse = await treatmentsPost(
      createMutationRequest("http://localhost/api/doctor/treatments", {
        patientProfileId: patientUser.patientProfile!.id,
        diagnosis: "Full treatment plan",
        stages: [
          { title: "Diagnostics", cost: 10000 },
          { title: "Cleaning", cost: 15000 },
          { title: "Restoration", cost: 20000 },
        ],
        status: "ACTIVE",
      }, "40.40.40.1"),
    );

    expect(treatmentResponse.status).toBe(200);
    const treatmentData = (await treatmentResponse.json()) as { treatment?: { id: string; totalCost: number } };
    const treatmentId = treatmentData.treatment?.id;
    expect(treatmentId).toBeTruthy();
    expect(treatmentData.treatment?.totalCost).toBe(45000);

    sessionState.userId = patientUser.id;
    const approveResponse = await treatmentApprovePost(
      createMutationRequest(
        `http://localhost/api/patient/treatments/${treatmentId}/approve`,
        { approved: true },
        "40.40.40.2",
      ),
      { params: { treatmentId: treatmentId! } },
    );

    expect(approveResponse.status).toBe(200);

    sessionState.userId = doctorUser.id;
    const paymentResponse = await paymentsPost(
      createMutationRequest("http://localhost/api/doctor/payments", {
        treatmentId,
        amount: 20000,
        method: "CASH",
        note: "Advance payment",
      }, "40.40.40.3"),
    );

    expect(paymentResponse.status).toBe(200);

    const updatedTreatment = await prisma.treatment.findUnique({ where: { id: treatmentId! } });
    expect(updatedTreatment?.paidAmount).toBe(20000);
    expect(updatedTreatment?.totalCost).toBe(45000);

    const payments = await prisma.payment.findMany({ where: { treatmentId: treatmentId! } });
    expect(payments).toHaveLength(1);
    expect(payments[0].amount).toBe(20000);
  });

  it("covers doctor-patient chat and notification feed", async () => {
    const doctorUser = await prisma.user.create({
      data: {
        email: "doctor.chat@dent.kz",
        password: "hash",
        role: "DOCTOR",
        name: "Doctor Chat",
        isVerified: true,
        doctorProfile: {
          create: {
            specializations: JSON.stringify(["Surgeon"]),
          },
        },
      },
    });

    const patientUser = await prisma.user.create({
      data: {
        email: "patient.chat@dent.kz",
        password: "hash",
        role: "PATIENT",
        name: "Patient Chat",
        isVerified: true,
        patientProfile: { create: {} },
      },
    });

    const doctorProfileId = (await prisma.doctorProfile.findUnique({ where: { userId: doctorUser.id }, select: { id: true } }))!.id;
    const patientProfileId = (await prisma.patientProfile.findUnique({ where: { userId: patientUser.id }, select: { id: true } }))!.id;

    await prisma.appointment.create({
      data: {
        doctorId: doctorProfileId,
        patientId: patientProfileId,
        dateTime: new Date(Date.now() + 86400000),
        status: "CONFIRMED",
        type: "CONSULTATION",
      },
    });

    sessionState.userId = doctorUser.id;
    const sendMessageResponse = await messagePost(
      createMutationRequest(
        `http://localhost/api/messages/${patientUser.id}`,
        { content: "Сәлем, қабылдауға дайындалыңыз" },
        "50.50.50.1",
      ),
      { params: { userId: patientUser.id } },
    );

    expect(sendMessageResponse.status).toBe(200);

    const message = await prisma.message.findFirst({
      where: {
        senderId: doctorUser.id,
        receiverId: patientUser.id,
      },
    });
    expect(message).not.toBeNull();

    sessionState.userId = patientUser.id;
    const notificationsResponse = await notificationsGet();
    expect(notificationsResponse.status).toBe(200);
    const data = (await notificationsResponse.json()) as {
      notifications?: Array<{ title: string; body: string; type: string }>;
    };

    expect((data.notifications ?? []).some((item) => item.type === "MESSAGE")).toBe(true);
  });
});
