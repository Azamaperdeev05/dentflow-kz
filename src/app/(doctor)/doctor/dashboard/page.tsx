import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { requireDoctorPage } from "@/lib/session";
import { DoctorNav } from "@/components/doctor/doctor-nav";
import { getAppointmentStatusLabel } from "@/lib/kz-labels";

export default async function DoctorDashboardPage() {
  const { user, doctorProfile } = await requireDoctorPage();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const [todayAppointments, weekCount, unreadMessages, patientCount, todayPayments] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId: doctorProfile.id,
        dateTime: { gte: startOfToday, lt: endOfToday },
      },
      include: {
        patient: { include: { user: { select: { name: true } } } },
      },
      orderBy: { dateTime: "asc" },
    }),
    prisma.appointment.count({
      where: {
        doctorId: doctorProfile.id,
        dateTime: { gte: startOfWeek },
      },
    }),
    prisma.message.count({ where: { receiverId: user.id, isRead: false } }),
    prisma.appointment.groupBy({ where: { doctorId: doctorProfile.id }, by: ["patientId"] }),
    prisma.payment.findMany({
      where: {
        treatment: {
          appointment: {
            doctorId: doctorProfile.id,
            dateTime: { gte: startOfToday, lt: endOfToday },
          },
        },
      },
      select: { amount: true },
    }),
  ]);

  const todayRevenue = todayPayments.reduce((sum, item) => sum + item.amount, 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row">
      <DoctorNav />

      <section className="min-w-0 flex-1 space-y-6">
        <header>
          <h1 className="text-4xl font-bold text-slate-900">Сәлем, Dr. {user.name}! 👋</h1>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 ring-1 ring-cyan-200 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700">Бүгінгі қабылдау</p>
                <p className="mt-2 text-3xl font-bold text-cyan-900">{todayAppointments.length}</p>
              </div>
              <Image src="/icons/windows11-filled/calendar.png" alt="Today appointments" width={34} height={34} className="opacity-90" />
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 ring-1 ring-blue-200 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Аптадағы қабылдау</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">{weekCount}</p>
              </div>
              <Image src="/icons/windows11-filled/dashboard.png" alt="Weekly appointments" width={34} height={34} className="opacity-90" />
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 ring-1 ring-purple-200 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Жаңа хабарлама</p>
                <p className="mt-2 text-3xl font-bold text-purple-900">{unreadMessages}</p>
              </div>
              <Image src="/icons/windows11-filled/messages.png" alt="Messages" width={34} height={34} className="opacity-90" />
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 ring-1 ring-emerald-200 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Бүгінгі түсім</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{todayRevenue.toLocaleString("kk-KZ")} ₸</p>
              </div>
              <Image src="/icons/windows11-filled/finance.png" alt="Revenue" width={34} height={34} className="opacity-90" />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Келесі қабылдаулар</h2>
              <Image src="/icons/windows11-filled/schedule.png" alt="Schedule" width={20} height={20} className="opacity-90" />
            </div>
            {todayAppointments.length === 0 ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-center">
                <p className="text-slate-600">Бүгін қабылдау жоқ</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                {todayAppointments.map((apt) => (
                  <div key={apt.id} className="rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 p-3 border border-cyan-200">
                    <p className="font-semibold text-slate-900">{apt.patient.user.name}</p>
                    <p className="text-xs text-slate-600">
                      {new Date(apt.dateTime).toLocaleTimeString("kk-KZ", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                      apt.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : apt.status === "CONFIRMED"
                        ? "bg-blue-100 text-blue-700"
                        : apt.status === "PENDING"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {getAppointmentStatusLabel(apt.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/doctor/schedule" className="mt-4 inline-block text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition">
              Толық кесте → 
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Статистика</h2>
              <Image src="/icons/windows11-filled/dashboard.png" alt="Statistics" width={20} height={20} className="opacity-90" />
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 p-4 border border-blue-200">
                <p className="text-sm text-slate-600">Барлық пациент</p>
                <p className="mt-1 text-3xl font-bold text-blue-900">{patientCount.length}</p>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border border-emerald-200">
                <p className="text-sm text-slate-600">Бүгінгі түсім</p>
                <p className="mt-1 text-2xl font-bold text-emerald-900">{todayRevenue.toLocaleString("kk-KZ")} ₸</p>
              </div>
            </div>
            <Link href="/doctor/finance" className="mt-4 inline-block text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition">
              Қаржы ақпараты → 
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
