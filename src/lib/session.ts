import { auth } from "@/lib/auth";
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
    throw new Error("FORBIDDEN");
  }

  return {
    user,
    doctorProfile: user.doctorProfile,
  };
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
