import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { startOfMonth } from "date-fns";

export async function GET() {
  try {
    await requireAdmin();

    const monthStart = startOfMonth(new Date());

    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      pendingDoctorCount,
      rejectedDoctorCount,
      totalAppointments,
      monthAppointments,
      monthRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "DOCTOR" } }),
      prisma.user.count({ where: { role: "PATIENT" } }),
      prisma.user.count({ where: { role: "DOCTOR", doctorApprovalStatus: "PENDING" } }),
      prisma.user.count({ where: { role: "DOCTOR", doctorApprovalStatus: "REJECTED" } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { dateTime: { gte: monthStart } } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paidAt: { gte: monthStart } },
      }),
    ]);

    return Response.json({
      totalUsers,
      totalDoctors,
      totalPatients,
      pendingDoctorCount,
      rejectedDoctorCount,
      totalAppointments,
      monthAppointments,
      monthRevenue: monthRevenue._sum.amount ?? 0,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
      if (error.message === "TWO_FACTOR_REQUIRED") return Response.json({ error: "2FA талап етіледі" }, { status: 403 });
    }
    return Response.json({ error: "Ішкі сервер қатесі" }, { status: 500 });
  }
}
