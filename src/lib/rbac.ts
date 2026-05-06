import { prisma } from "@/lib/db";

export async function canDoctorAccessPatient(doctorProfileId: string, patientProfileId: string) {
  const [doctor, patient] = await Promise.all([
    prisma.doctorProfile.findUnique({
      where: { id: doctorProfileId },
      select: { id: true },
    }),
    prisma.patientProfile.findUnique({
      where: { id: patientProfileId },
      select: { id: true },
    }),
  ]);

  return Boolean(doctor && patient);
}

export async function canUsersChat(senderId: string, receiverId: string) {
  const [sender, receiver] = await Promise.all([
    prisma.user.findUnique({
      where: { id: senderId },
      select: {
        id: true,
        role: true,
        patientProfile: { select: { id: true } },
        doctorProfile: { select: { id: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: receiverId },
      select: {
        id: true,
        role: true,
        patientProfile: { select: { id: true } },
        doctorProfile: { select: { id: true } },
      },
    }),
  ]);

  if (!sender || !receiver) {
    return false;
  }

  if (sender.id === receiver.id) {
    return true;
  }

  if (sender.role === "ADMIN" || receiver.role === "ADMIN") {
    return true;
  }

  const isDoctorPatientPair =
    (sender.role === "DOCTOR" && receiver.role === "PATIENT") ||
    (sender.role === "PATIENT" && receiver.role === "DOCTOR");

  if (!isDoctorPatientPair) {
    return false;
  }

  const doctorProfileId = sender.role === "DOCTOR" ? sender.doctorProfile?.id : receiver.doctorProfile?.id;
  const patientProfileId = sender.role === "PATIENT" ? sender.patientProfile?.id : receiver.patientProfile?.id;

  if (!doctorProfileId || !patientProfileId) {
    return false;
  }

  const relationCount = await prisma.appointment.count({
    where: {
      doctorId: doctorProfileId,
      patientId: patientProfileId,
    },
  });

  return relationCount > 0;
}
