import { auth } from "@/lib/auth";
import { logAccessDenied } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export async function requireSessionUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      patientProfile: true,
      doctorProfile: true,
    },
  });

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requirePatient() {
  const user = await requireSessionUser();

  if (user.role !== "PATIENT" || !user.patientProfile) {
    await logAccessDenied({
      userId: user.id,
      userRole: user.role,
      action: "PATIENT_ACCESS_REQUIRED",
      resource: "SESSION",
      metadata: { hasPatientProfile: Boolean(user.patientProfile) },
    });
    throw new Error("FORBIDDEN");
  }

  return {
    user,
    patientProfile: user.patientProfile,
  };
}

export async function requireDoctor() {
  const user = await requireSessionUser();

  if (user.role !== "DOCTOR" || !user.doctorProfile) {
    await logAccessDenied({
      userId: user.id,
      userRole: user.role,
      action: "DOCTOR_ACCESS_REQUIRED",
      resource: "SESSION",
      metadata: { hasDoctorProfile: Boolean(user.doctorProfile) },
    });
    throw new Error("FORBIDDEN");
  }

  return {
    user,
    doctorProfile: user.doctorProfile,
  };
}

export async function requireAdmin(options?: { requireTwoFactor?: boolean }) {
  const user = await requireSessionUser();
  const requireTwoFactor = options?.requireTwoFactor ?? true;

  if (user.role !== "ADMIN") {
    await logAccessDenied({
      userId: user.id,
      userRole: user.role,
      action: "ADMIN_ACCESS_REQUIRED",
      resource: "SESSION",
    });
    throw new Error("FORBIDDEN");
  }

  if (requireTwoFactor && !user.twoFactorEnabled) {
    await logAccessDenied({
      userId: user.id,
      userRole: user.role,
      action: "ADMIN_2FA_REQUIRED",
      resource: "SESSION",
      metadata: { twoFactorEnabled: user.twoFactorEnabled },
    });
    throw new Error("TWO_FACTOR_REQUIRED");
  }

  return { user };
}

export async function requireSessionUserPage() {
  try {
    return await requireSessionUser();
  } catch {
    redirect("/login");
  }
}

export async function requirePatientPage() {
  const user = await requireSessionUserPage();

  if (user.role !== "PATIENT" || !user.patientProfile) {
    if (user.role === "DOCTOR") {
      redirect("/doctor/dashboard");
    }
    redirect("/login");
  }

  return {
    user,
    patientProfile: user.patientProfile,
  };
}

export async function requireDoctorPage() {
  const user = await requireSessionUserPage();

  if (user.role !== "DOCTOR" || !user.doctorProfile) {
    if (user.role === "PATIENT") {
      redirect("/patient/dashboard");
    }
    redirect("/login");
  }

  return {
    user,
    doctorProfile: user.doctorProfile,
  };
}

export async function requireAdminPage(options?: { requireTwoFactor?: boolean }) {
  const user = await requireSessionUserPage();
  const requireTwoFactor = options?.requireTwoFactor ?? true;

  if (user.role !== "ADMIN") {
    if (user.role === "DOCTOR") {
      redirect("/doctor/dashboard");
    }
    if (user.role === "PATIENT") {
      redirect("/patient/dashboard");
    }
    redirect("/login");
  }

  if (requireTwoFactor && !user.twoFactorEnabled) {
    redirect("/admin/profile?setup2fa=1");
  }

  return { user };
}
