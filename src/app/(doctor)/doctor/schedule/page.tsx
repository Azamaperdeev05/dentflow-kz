import Link from "next/link";
import { prisma } from "@/lib/db";
import Image from "next/image";
import { requireDoctorPage } from "@/lib/session";
import { DoctorNav } from "@/components/doctor/doctor-nav";
import { ScheduleStatusActions } from "@/components/doctor/schedule-status-actions";
import { getAppointmentStatusLabel, getAppointmentTypeLabel } from "@/lib/kz-labels";
import { DoctorScheduleCalendar } from "@/components/doctor/schedule-calendar";
import { getMonthLabelKk, getNextMonth, getPreviousMonth, getDayKey } from "@/lib/scheduling";

type Props = {
  searchParams?: {
    month?: string;
  };
};

function parseMonthParam(value?: string) {
  const current = new Date();

  if (!value) {
    return { year: current.getFullYear(), month: current.getMonth() };
  }

  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return { year: current.getFullYear(), month: current.getMonth() };
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;

  if (month < 0 || month > 11) {
    return { year: current.getFullYear(), month: current.getMonth() };
  }

  return { year, month };
}

export default async function DoctorSchedulePage({ searchParams }: Props) {
  const { doctorProfile } = await requireDoctorPage();
  const { year, month } = parseMonthParam(searchParams?.month);
  const displayDate = new Date(year, month, 1);
  const monthLabel = getMonthLabelKk(year, month);
  const prevMonth = getPreviousMonth(year, month);
  const nextMonth = getNextMonth(year, month);

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctorProfile.id,
      dateTime: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
    include: {
      patient: { include: { user: { select: { name: true, phone: true } } } },
    },
    orderBy: { dateTime: "asc" },
  });

  const calendarMarkers: Record<string, { hasAppointments?: boolean; hasCompletedTreatments?: boolean }> = {};
  for (const item of appointments) {
    const date = new Date(item.dateTime);
    const key = getDayKey(date);
    if (!calendarMarkers[key]) {
      calendarMarkers[key] = {};
    }
    calendarMarkers[key].hasAppointments = true;
    if (item.status === "COMPLETED") {
      calendarMarkers[key].hasCompletedTreatments = true;
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row">
      <DoctorNav />

      <section className="min-w-0 flex-1 space-y-6">
        <header className="space-y-4">
          <h1 className="flex items-center gap-3 text-4xl font-bold text-slate-900">
            <Image src="/icons/windows11-filled/schedule.png" alt="" width={36} height={36} />
            Қабылдаулар кестесі
          </h1>
        </header>

        <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/doctor/schedule?month=${prevMonth.year}-${String(prevMonth.month + 1).padStart(2, "0")}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← Алдыңғы ай
            </Link>
            <h2 className="text-xl font-bold text-slate-900">{monthLabel}</h2>
            <Link
              href={`/doctor/schedule?month=${nextMonth.year}-${String(nextMonth.month + 1).padStart(2, "0")}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Келесі ай →
            </Link>
          </div>

          <div className="mt-4">
            <DoctorScheduleCalendar
              year={displayDate.getFullYear()}
              month={displayDate.getMonth()}
              monthLabel={monthLabel}
              markers={calendarMarkers}
            />
          </div>
        </section>

        <div className="-mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" />Клиент келген күн</span>
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Емделген күн</span>
        </div>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="inline-flex items-center gap-2 text-slate-500 text-lg"><Image src="/icons/windows11-outline/messages.png" alt="" width={18} height={18} />Қабылдау жазбалары жоқ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-700 font-semibold">
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/calendar.png" alt="" width={15} height={15} />Күні</span></th>
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/patients.png" alt="" width={15} height={15} />Пациент</span></th>
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/profile.png" alt="" width={15} height={15} />Телефон</span></th>
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/treatment.png" alt="" width={15} height={15} />Түрі</span></th>
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/messages.png" alt="" width={15} height={15} />Шағым</span></th>
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/dashboard.png" alt="" width={15} height={15} />Статус</span></th>
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/doctor.png" alt="" width={15} height={15} />Әрекет</span></th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-slate-100 transition hover:bg-slate-50 align-top ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}>
                      <td className="py-3 px-4 font-medium text-slate-900">{new Date(item.dateTime).toLocaleString("kk-KZ")}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.patient.user.name}</td>
                      <td className="py-3 px-4 text-slate-700">{item.patient.user.phone || "—"}</td>
                      <td className="py-3 px-4 text-slate-700">{getAppointmentTypeLabel(item.type)}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{item.complaint || "—"}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          item.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : item.status === "CONFIRMED"
                            ? "bg-blue-100 text-blue-700"
                            : item.status === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {item.status === "COMPLETED"
                            ? getAppointmentStatusLabel("COMPLETED")
                            : item.status === "CONFIRMED"
                            ? getAppointmentStatusLabel("CONFIRMED")
                            : item.status === "PENDING"
                            ? getAppointmentStatusLabel("PENDING")
                            : getAppointmentStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <ScheduleStatusActions appointmentId={item.id} currentStatus={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
