import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { requirePatientPage } from "@/lib/session";

export default async function PatientDashboardPage() {
  const { user, patientProfile } = await requirePatientPage();

  const [appointmentCount, completedCount, pendingCount, treatments, unreadMessages, nextAppointment] =
    await Promise.all([
      prisma.appointment.count({ where: { patientId: patientProfile.id } }),
      prisma.appointment.count({ where: { patientId: patientProfile.id, status: "COMPLETED" } }),
      prisma.appointment.count({
        where: {
          patientId: patientProfile.id,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      }),
      prisma.treatment.findMany({ where: { patientId: patientProfile.id }, select: { totalCost: true } }),
      prisma.message.count({ where: { receiverId: user.id, isRead: false } }),
      prisma.appointment.findFirst({
        where: { patientId: patientProfile.id, dateTime: { gte: new Date() } },
        include: { doctor: { include: { user: { select: { name: true } } } } },
        orderBy: { dateTime: "asc" },
      }),
    ]);

  const totalCost = treatments.reduce((sum, t) => sum + t.totalCost, 0);

  return (
    <main className="flex min-h-[calc(100vh-8rem)] w-full flex-col gap-6 py-4">
        <header className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Сәлем, {user.name}! 👋</h1>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 ring-1 ring-cyan-200 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700">Жалпы қабылдау</p>
                <p className="mt-2 text-3xl font-bold text-cyan-900">{appointmentCount}</p>
              </div>
              <Image src="/icons/windows11-filled/dashboard.png" alt="Dashboard" width={34} height={34} className="opacity-90" />
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 ring-1 ring-emerald-200 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Аяқталған</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{completedCount}</p>
              </div>
              <Image src="/icons/windows11-filled/schedule.png" alt="Completed" width={34} height={34} className="opacity-90" />
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 p-6 ring-1 ring-amber-200 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Күтіп тұр</p>
                <p className="mt-2 text-3xl font-bold text-amber-900">{pendingCount}</p>
              </div>
              <Image src="/icons/windows11-filled/calendar.png" alt="Pending" width={34} height={34} className="opacity-90" />
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-6 ring-1 ring-slate-200 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Жалпы шығын</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{totalCost.toLocaleString("kk-KZ")} ₸</p>
              </div>
              <Image src="/icons/windows11-filled/finance.png" alt="Finance" width={34} height={34} className="opacity-90" />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Жақын қабылдау</h2>
              <Image src="/icons/windows11-filled/calendar.png" alt="Calendar" width={20} height={20} className="opacity-90" />
            </div>
            {nextAppointment ? (
              <div className="mt-4 space-y-3 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 p-4 border border-cyan-200">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Дәрігер</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{nextAppointment.doctor.user.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Қабылдау уақыты</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {new Date(nextAppointment.dateTime).toLocaleString("kk-KZ", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    nextAppointment.status === "CONFIRMED"
                      ? "bg-green-100 text-green-700"
                      : nextAppointment.status === "PENDING"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {nextAppointment.status === "CONFIRMED" ? "✅ Растамалаған" : nextAppointment.status === "PENDING" ? "⏳ Күтіліуде" : nextAppointment.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-center">
                <p className="text-slate-600">Жақын қабылдау жоқ</p>
              </div>
            )}
            <Link href="/patient/appointments" className="mt-4 inline-block text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition">
              Барлық қабылдаулар → 
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Хабарламалар</h2>
              <Image src="/icons/windows11-filled/messages.png" alt="Messages" width={20} height={20} className="opacity-90" />
            </div>
            <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-4 border border-blue-200">
              <p className="text-sm text-slate-600">Оқылмаған хабар саны</p>
              <p className="mt-1 text-3xl font-bold text-blue-900">{unreadMessages}</p>
            </div>
            <Link href="/patient/messages" className="mt-4 inline-block text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition">
              Хабарламаларға өту → 
            </Link>
          </div>
        </section>
      </main>
  );
}
