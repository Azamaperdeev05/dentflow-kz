import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/session";
import { AdminNav } from "@/components/admin/admin-nav";
import { DoctorApprovalActions } from "@/components/admin/doctor-approval-actions";
import { startOfMonth } from "date-fns";

export default async function AdminDashboardPage() {
  await requireAdminPage();

  const monthStart = startOfMonth(new Date());

  const [
    totalUsers,
    totalDoctors,
    totalPatients,
    pendingDoctorCount,
    monthAppointments,
    monthRevenue,
    pendingDoctors,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "DOCTOR" } }),
    prisma.user.count({ where: { role: "PATIENT" } }),
    prisma.user.count({ where: { role: "DOCTOR", doctorApprovalStatus: "PENDING" } }),
    prisma.appointment.count({ where: { dateTime: { gte: monthStart } } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: monthStart } },
    }),
    prisma.user.findMany({
      where: { role: "DOCTOR", doctorApprovalStatus: "PENDING" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        doctorProfile: { select: { specializations: true, licenseNumber: true, experience: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
  ]);

  const monthRevenueAmount = monthRevenue._sum.amount ?? 0;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row">
      <AdminNav />

      <section className="min-w-0 flex-1 space-y-6">
        <header>
          <h1 className="text-4xl font-bold text-slate-900">Дашборд</h1>
          <p className="mt-1 text-slate-500">Жүйе жай-күйінің шолуы</p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 ring-1 ring-blue-200 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Барлық пайдаланушы</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">{totalUsers}</p>
              </div>
              <Image src="/icons/windows11-filled/profile.png" alt="" width={34} height={34} className="opacity-90" />
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 ring-1 ring-emerald-200 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Дәрігерлер</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{totalDoctors}</p>
              </div>
              <Image src="/icons/windows11-filled/doctor.png" alt="" width={34} height={34} className="opacity-90" />
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 ring-1 ring-cyan-200 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700">Пациенттер</p>
                <p className="mt-2 text-3xl font-bold text-cyan-900">{totalPatients}</p>
              </div>
              <Image src="/icons/windows11-filled/patients.png" alt="" width={34} height={34} className="opacity-90" />
            </div>
          </div>

          <div className={`rounded-2xl p-6 ring-1 shadow-sm transition hover:shadow-md ${pendingDoctorCount > 0 ? "bg-gradient-to-br from-amber-50 to-orange-100 ring-amber-200" : "bg-gradient-to-br from-slate-50 to-slate-100 ring-slate-200"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${pendingDoctorCount > 0 ? "text-amber-700" : "text-slate-600"}`}>Бекіту күтіліп тұр</p>
                <p className={`mt-2 text-3xl font-bold ${pendingDoctorCount > 0 ? "text-amber-900" : "text-slate-700"}`}>{pendingDoctorCount}</p>
              </div>
              {pendingDoctorCount > 0 && (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-lg font-bold text-white shadow">{pendingDoctorCount}</span>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Ай статистикасы</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 p-4 ring-1 ring-blue-100">
                <p className="text-sm text-slate-600">Ай жазылулары</p>
                <p className="mt-1 text-2xl font-bold text-blue-900">{monthAppointments}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-100">
                <p className="text-sm text-slate-600">Ай кірісі</p>
                <p className="mt-1 text-2xl font-bold text-emerald-900">{monthRevenueAmount.toLocaleString("kk-KZ")} ₸</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Бекіту күтіліп тұрған дәрігерлер</h2>
              {pendingDoctorCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{pendingDoctorCount}</span>
              )}
            </div>

            {pendingDoctors.length === 0 ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center ring-1 ring-slate-100">
                <p className="text-sm text-slate-500">Бекіту күтіліп тұрған өтінім жоқ</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {pendingDoctors.map((doctor) => {
                  const specs: string[] = JSON.parse(doctor.doctorProfile?.specializations ?? "[]") as string[];
                  return (
                    <div key={doctor.id} className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{doctor.name}</p>
                          <p className="truncate text-xs text-slate-500">{doctor.email}</p>
                          {specs.length > 0 && (
                            <p className="mt-0.5 truncate text-xs text-amber-700">{specs.slice(0, 2).join(", ")}</p>
                          )}
                        </div>
                        <DoctorApprovalActions
                          userId={doctor.id}
                          doctorName={doctor.name}
                          currentStatus="PENDING"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Link
              href="/admin/doctors"
              className="mt-4 inline-block text-sm font-semibold text-amber-600 hover:text-amber-700 transition"
            >
              Барлық дәрігерлер →
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
