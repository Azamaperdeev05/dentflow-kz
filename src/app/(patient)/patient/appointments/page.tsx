import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { requirePatientPage } from "@/lib/session";
import { AppointmentCalendar } from "@/components/patient/appointment-calendar";
import { AppointmentActions } from "@/components/patient/appointment-actions";
import { getAppointmentStatusLabel, getAppointmentTypeLabel } from "@/lib/kz-labels";
import { getDayKey, getMonthLabelKk, getNextMonth, getPreviousMonth, isWorkingDay } from "@/lib/scheduling";

type Props = {
  searchParams?: {
    month?: string;
  };
};

function parseMonthParam(value?: string) {
  const now = new Date();

  if (!value) {
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;

  if (month < 0 || month > 11) {
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  return { year, month };
}

export default async function PatientAppointmentsPage({ searchParams }: Props) {
  const { patientProfile } = await requirePatientPage();
  const { year, month } = parseMonthParam(searchParams?.month);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);
  const monthLabel = getMonthLabelKk(year, month);
  const prevMonth = getPreviousMonth(year, month);
  const nextMonth = getNextMonth(year, month);

  const [appointments, doctors, monthDoctorAppointments] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId: patientProfile.id },
      include: {
        doctor: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { dateTime: "asc" },
    }),
    prisma.doctorProfile.findMany({
      where: { isAvailable: true },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.appointment.findMany({
      where: {
        dateTime: { gte: monthStart, lt: monthEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: {
        doctorId: true,
        dateTime: true,
      },
    }),
  ]);

  const busyDoctorIdsByDate: Record<string, string[]> = {};
  for (const item of monthDoctorAppointments) {
    const key = getDayKey(new Date(item.dateTime));
    if (!busyDoctorIdsByDate[key]) {
      busyDoctorIdsByDate[key] = [];
    }
    if (!busyDoctorIdsByDate[key].includes(item.doctorId)) {
      busyDoctorIdsByDate[key].push(item.doctorId);
    }
  }

  const calendarMarkers: Record<string, { isUnavailableDay?: boolean }> = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = getDayKey(date);
    const workingDoctors = doctors.filter((doctor) => isWorkingDay(doctor.workDays, date));
    const busyCount = (busyDoctorIdsByDate[key] ?? []).length;

    if (workingDoctors.length === 0 || busyCount >= workingDoctors.length) {
      calendarMarkers[key] = { isUnavailableDay: true };
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-8rem)] w-full flex-col gap-6 py-4">
        <header className="space-y-4">
          <h1 className="flex items-center gap-3 text-4xl font-bold text-slate-900">
            <Image src="/icons/windows11-filled/calendar.png" alt="" width={36} height={36} />
            Қабылдаулар
          </h1>
        </header>

        <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/patient/appointments?month=${prevMonth.year}-${String(prevMonth.month + 1).padStart(2, "0")}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← Алдыңғы ай
            </Link>

            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900">{monthLabel}</h2>
              <p className="text-sm text-slate-500">Күнді басыңыз, жаңа брондау беті ашылады</p>
            </div>

            <Link
              href={`/patient/appointments?month=${nextMonth.year}-${String(nextMonth.month + 1).padStart(2, "0")}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Келесі ай →
            </Link>
          </div>

          <div className="mt-4">
            <AppointmentCalendar year={year} month={month} monthLabel={monthLabel} markers={calendarMarkers} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" />Демалыс немесе бос орын жоқ күн</span>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Менің қабылдауларым</h2>

          {appointments.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="inline-flex items-center gap-2 text-slate-600">
                <Image src="/icons/windows11-outline/messages.png" alt="" width={18} height={18} />
                Әзірге қабылдау жоқ
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left font-semibold text-slate-700">
                    <th className="px-4 py-3"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/calendar.png" alt="" width={15} height={15} />Күні</span></th>
                    <th className="px-4 py-3"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/doctor.png" alt="" width={15} height={15} />Дәрігер</span></th>
                    <th className="px-4 py-3"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/treatment.png" alt="" width={15} height={15} />Түрі</span></th>
                    <th className="px-4 py-3"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/dashboard.png" alt="" width={15} height={15} />Статус</span></th>
                    <th className="px-4 py-3"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/messages.png" alt="" width={15} height={15} />Шағым</span></th>
                    <th className="px-4 py-3">Әрекет</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment, idx) => (
                    <tr
                      key={appointment.id}
                      className={`border-b border-slate-100 transition hover:bg-slate-50 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                    >
                      <td className="px-4 py-3 text-slate-700">{new Date(appointment.dateTime).toLocaleString("kk-KZ")}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{appointment.doctor.user.name}</td>
                      <td className="px-4 py-3 text-slate-700">{getAppointmentTypeLabel(appointment.type)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          appointment.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : appointment.status === "CONFIRMED"
                            ? "bg-blue-100 text-blue-700"
                            : appointment.status === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {appointment.status === "COMPLETED"
                            ? getAppointmentStatusLabel("COMPLETED")
                            : appointment.status === "CONFIRMED"
                            ? getAppointmentStatusLabel("CONFIRMED")
                            : appointment.status === "PENDING"
                            ? getAppointmentStatusLabel("PENDING")
                            : getAppointmentStatusLabel(appointment.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{appointment.complaint || "—"}</td>
                      <td className="px-4 py-3 align-top">
                        <AppointmentActions
                          appointmentId={appointment.id}
                          appointmentDateTime={new Date(appointment.dateTime).toISOString()}
                          canManage={
                            (appointment.status === "PENDING" || appointment.status === "CONFIRMED") &&
                            new Date(appointment.dateTime).getTime() > Date.now()
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
    </main>
  );
}
