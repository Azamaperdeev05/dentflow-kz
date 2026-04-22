import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/session";
import { DoctorApprovalActions } from "@/components/admin/doctor-approval-actions";
import { getDoctorApprovalStatusLabel } from "@/lib/kz-labels";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const tabs: { label: string; value: StatusFilter }[] = [
  { label: "Барлығы", value: "ALL" },
  { label: "Бекіту күтіліп тұр", value: "PENDING" },
  { label: "Белсенді", value: "APPROVED" },
  { label: "Қабылданбаған", value: "REJECTED" },
];

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireAdminPage();

  const status = (searchParams.status ?? "PENDING") as StatusFilter;

  const whereStatus =
    status === "PENDING"
      ? { doctorApprovalStatus: "PENDING" }
      : status === "APPROVED"
        ? { doctorApprovalStatus: "APPROVED" }
        : status === "REJECTED"
          ? { doctorApprovalStatus: "REJECTED" }
          : {};

  const [doctors, counts] = await Promise.all([
    prisma.user.findMany({
      where: { role: "DOCTOR", ...whereStatus },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        doctorApprovalStatus: true,
        doctorProfile: {
          select: {
            specializations: true,
            experience: true,
            licenseNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    Promise.all([
      prisma.user.count({ where: { role: "DOCTOR" } }),
      prisma.user.count({ where: { role: "DOCTOR", doctorApprovalStatus: "PENDING" } }),
      prisma.user.count({ where: { role: "DOCTOR", doctorApprovalStatus: "APPROVED" } }),
      prisma.user.count({ where: { role: "DOCTOR", doctorApprovalStatus: "REJECTED" } }),
    ]),
  ]);

  const [allCount, pendingCount, approvedCount, rejectedCount] = counts;

  const tabCounts: Record<StatusFilter, number> = {
    ALL: allCount,
    PENDING: pendingCount,
    APPROVED: approvedCount,
    REJECTED: rejectedCount,
  };

  return (
    <main className="space-y-6 py-4">
      <header>
        <h1 className="text-4xl font-bold text-slate-900">Дәрігерлер</h1>
        <p className="mt-1 text-slate-500">Тіркелу өтінімдерін басқару</p>
      </header>

        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/admin/doctors?status=${tab.value}`}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                status === tab.value
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${status === tab.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                {tabCounts[tab.value]}
              </span>
            </Link>
          ))}
        </nav>

        <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
          {doctors.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-500">Дәрігер табылмады</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Аты</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Мамандық</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Тәжірибе</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Лицензия</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Тіркелген</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Статус</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Іс-қимыл</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor, idx) => {
                    const specs: string[] = JSON.parse(doctor.doctorProfile?.specializations ?? "[]") as string[];
                    return (
                      <tr key={doctor.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{doctor.name}</p>
                          <p className="text-xs text-slate-500">{doctor.email}</p>
                          {doctor.phone && <p className="text-xs text-slate-400">{doctor.phone}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {specs.length > 0 ? specs.slice(0, 2).join(", ") : "—"}
                          {specs.length > 2 && <span className="text-slate-400"> +{specs.length - 2}</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {doctor.doctorProfile?.experience ? `${doctor.doctorProfile.experience} жыл` : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {doctor.doctorProfile?.licenseNumber ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {new Date(doctor.createdAt).toLocaleDateString("kk-KZ")}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            doctor.doctorApprovalStatus === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : doctor.doctorApprovalStatus === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                          }`}>
                            {getDoctorApprovalStatusLabel(doctor.doctorApprovalStatus ?? null)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <DoctorApprovalActions
                            userId={doctor.id}
                            doctorName={doctor.name}
                            currentStatus={doctor.doctorApprovalStatus ?? null}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </main>
  );
}
