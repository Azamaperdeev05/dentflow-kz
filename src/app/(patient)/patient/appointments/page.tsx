import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { requirePatientPage } from "@/lib/session";
import { AppointmentCalendar } from "@/components/patient/appointment-calendar";
import { AppointmentActions } from "@/components/patient/appointment-actions";
import { getAppointmentStatusLabel, getAppointmentTypeLabel } from "@/lib/kz-labels";
import { buildTimeSlots, combineDateAndTime, getDayKey, getMaxAppointmentTypeDurationMinutes, getMonthLabelKk, getNextMonth, getPreviousMonth, isWorkingDay } from "@/lib/scheduling";

type Props = {
  searchParams?: {
    month?: string;
    doctorId?: string;
    selecting?: string;
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
  const doctorId = searchParams?.doctorId;
  const isSelecting = searchParams?.selecting === "1";
  const { year, month } = parseMonthParam(searchParams?.month);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);
  const monthLabel = getMonthLabelKk(year, month);
  const prevMonth = getPreviousMonth(year, month);
  const nextMonth = getNextMonth(year, month);

  const today = new Date();
  const todayKey = getDayKey(today);
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const [appointments, doctors, monthDoctorAppointments, todayAppointments] = await Promise.all([
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
        ...(doctorId ? { doctorId } : {}),
        dateTime: { gte: monthStart, lt: monthEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: {
        doctorId: true,
        dateTime: true,
      },
    }),
    prisma.appointment.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        dateTime: { gte: dayStart, lt: dayEnd },
      },
      select: {
        doctorId: true,
        dateTime: true,
        duration: true,
      },
    }),
  ]);

  const selectedDoctor = doctorId ? doctors.find(d => d.id === doctorId) : null;

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
    
    if (selectedDoctor) {
      const isWorking = isWorkingDay(selectedDoctor.workDays, date);
      const isBusy = (busyDoctorIdsByDate[key] ?? []).includes(selectedDoctor.id);
      if (!isWorking || isBusy) {
        calendarMarkers[key] = { isUnavailableDay: true };
      }
    } else {
      const workingDoctors = doctors.filter((doctor) => isWorkingDay(doctor.workDays, date));
      const busyCount = (busyDoctorIdsByDate[key] ?? []).length;

      if (workingDoctors.length === 0 || busyCount >= workingDoctors.length) {
        calendarMarkers[key] = { isUnavailableDay: true };
      }
    }
  }

  if (!doctorId && !isSelecting) {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] w-full flex-col gap-10 py-6">
        <section className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-[3rem] bg-gradient-to-b from-white to-slate-50/50 border border-slate-100 shadow-sm">
          <div className="mx-auto w-24 h-24 rounded-full bg-cyan-50 flex items-center justify-center ring-4 ring-white shadow-md mb-8">
            <Image src="/icons/windows11-filled/doctor.png" alt="" width={48} height={48} />
          </div>
          <div className="max-w-md space-y-4 mb-8">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Жазылуды бастау</h1>
            <p className="text-lg text-slate-500 leading-relaxed">
              Білікті мамандар тізімінен өзіңізге ыңғайлы дәрігерді таңдап, қабылдауға жазылыңыз.
            </p>
          </div>
          <Link 
            href="/patient/appointments?selecting=1"
            className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-900 px-10 py-5 text-xl font-bold text-white shadow-xl transition-all hover:bg-cyan-600 hover:-translate-y-1 active:translate-y-0 overflow-hidden"
          >
            <span className="relative z-10">👨‍⚕️ Дәрігерді таңдау</span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </section>

        <section className="w-full space-y-6">
           <div className="flex items-center justify-between px-2">
             <h2 className="text-2xl font-bold text-slate-900">Менің қабылдауларым</h2>
             <Link href="/patient/medical-history" className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition-colors">
               Барлығын көру →
             </Link>
           </div>
           
           {appointments.length === 0 ? (
            <div className="rounded-[2.5rem] border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                 <Image src="/icons/windows11-outline/calendar.png" alt="" width={24} height={24} className="opacity-40" />
              </div>
              <p className="text-slate-400 font-medium text-lg">Әзірге белсенді қабылдаулар жоқ</p>
            </div>
           ) : (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {appointments.slice(0, 6).map((app) => (
                  <div key={app.id} className="group flex flex-col gap-4 rounded-[2rem] bg-white p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-2xl group-hover:bg-cyan-100 transition-colors">👨‍⚕️</div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        app.status === 'CONFIRMED' ? 'bg-green-50 text-green-600' : 'bg-cyan-50 text-cyan-600'
                      }`}>
                        {getAppointmentStatusLabel(app.status)}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg leading-tight">{app.doctor.user.name}</p>
                      <p className="text-sm text-slate-500 mt-1 font-medium">
                        {new Date(app.dateTime).toLocaleDateString("kk-KZ", { day: 'numeric', month: 'long' })} · {new Date(app.dateTime).toLocaleTimeString("kk-KZ", { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-slate-50 mt-auto">
                      <AppointmentActions
                        appointmentId={app.id}
                        appointmentDateTime={new Date(app.dateTime).toISOString()}
                        canManage={
                          (app.status === "PENDING" || app.status === "CONFIRMED") &&
                          new Date(app.dateTime).getTime() > Date.now()
                        }
                      />
                    </div>
                  </div>
                ))}
             </div>
           )}
        </section>
      </main>
    );
  }

  if (isSelecting) {
    const doctorsWithStats = doctors.map((doctor) => {
      const appointmentsToday = todayAppointments.filter((item) => item.doctorId === doctor.id);
      const canWorkToday = doctor.isAvailable && isWorkingDay(doctor.workDays, today);

      const availableSlotsToday = canWorkToday
        ? buildTimeSlots(doctor.workHoursStart, doctor.workHoursEnd, doctor.slotDuration).filter((time) => {
            const dateTime = combineDateAndTime(todayKey, time);
            if (!dateTime || dateTime < new Date()) return false;

            const candidateStart = dateTime.getTime();
            const candidateEnd = candidateStart + getMaxAppointmentTypeDurationMinutes(doctor.slotDuration) * 60 * 1000;
            return !appointmentsToday.some((appointment) => {
              const existingStart = new Date(appointment.dateTime).getTime();
              const existingEnd = existingStart + appointment.duration * 60 * 1000;
              return existingStart < candidateEnd && existingEnd > candidateStart;
            });
          }).length
        : 0;

      return { ...doctor, availableSlotsToday };
    });

    return (
      <main className="flex min-h-[calc(100vh-8rem)] w-full flex-col gap-6 py-4">
        <header className="flex items-center justify-between gap-4 mb-2">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">Дәрігерді таңдаңыз</h1>
          </div>
          <Link href="/patient/appointments" className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
            Қайту
          </Link>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {doctorsWithStats.map((doctor) => (
            <Link 
              key={doctor.id} 
              href={`/patient/appointments?doctorId=${doctor.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition-all hover:border-cyan-300 hover:bg-cyan-50/20 hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xl ring-1 ring-slate-100 transition-colors group-hover:bg-cyan-50 group-hover:ring-cyan-100">
                👨‍⚕️
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <h2 className="text-sm font-bold text-slate-900 group-hover:text-cyan-700 truncate leading-tight">
                  {doctor.user.name}
                </h2>
                <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">
                  {(() => {
                    try {
                      const specs = JSON.parse(doctor.specializations || "[]");
                      return specs.length > 0 ? specs[0] : "Жалпы стоматология";
                    } catch { return "Жалпы стоматология"; }
                  })()}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                   <span className="text-[9px] font-bold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                     {doctor.availableSlotsToday} бос уақыт
                   </span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </main>
    );
  }
  return (
    <main className="flex min-h-[calc(100vh-8rem)] w-full flex-col gap-6 py-4">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="flex items-center gap-3 text-4xl font-bold text-slate-900">
              <Image src="/icons/windows11-filled/calendar.png" alt="" width={36} height={36} />
              Күнтізбе
            </h1>
            <p className="text-slate-500 text-sm">Қолжетімді күнді таңдаңыз</p>
          </div>
          <Link href="/patient/appointments?selecting=1" className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100">
            🔄 Дәрігерді ауыстыру
          </Link>
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
              {selectedDoctor && (
                <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-200">
                  👨‍⚕️ {selectedDoctor.user.name} үшін брондау
                </div>
              )}
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
            <AppointmentCalendar 
              year={year} 
              month={month} 
              monthLabel={monthLabel} 
              markers={calendarMarkers} 
              doctorId={doctorId}
            />
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
