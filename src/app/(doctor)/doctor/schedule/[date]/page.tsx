import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireDoctorPage } from "@/lib/session";
import { DoctorNav } from "@/components/doctor/doctor-nav";
import { DayAppointmentForm } from "@/components/doctor/day-appointment-form";
import { getAppointmentStatusLabel, getAppointmentTypeLabel } from "@/lib/kz-labels";
import { buildTimeSlots, combineDateAndTime, getDayKey, parseDayKey, isWorkingDay } from "@/lib/scheduling";

type Props = {
  params: {
    date: string;
  };
};

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("kk-KZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function DoctorDaySchedulePage({ params }: Props) {
  const { doctorProfile } = await requireDoctorPage();
  const parsedDate = parseDayKey(params.date);

  if (!parsedDate) {
    notFound();
  }

  const dayStart = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
  const dayEnd = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate() + 1);

  const [appointments, patients] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId: doctorProfile.id,
        dateTime: { gte: dayStart, lt: dayEnd },
      },
      include: {
        patient: {
          include: {
            user: {
              select: { name: true, phone: true },
            },
          },
        },
      },
      orderBy: { dateTime: "asc" },
    }),
    prisma.patientProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { user: { name: "asc" } },
      take: 300,
    }),
  ]);

  const workingDay = isWorkingDay(doctorProfile.workDays, parsedDate);
  const baseSlots = workingDay
    ? buildTimeSlots(doctorProfile.workHoursStart, doctorProfile.workHoursEnd, doctorProfile.slotDuration)
    : [];

  const availableSlots = baseSlots.filter((slot) => {
    const dateTime = combineDateAndTime(params.date, slot);
    if (!dateTime) {
      return false;
    }

    const now = new Date();
    if (getDayKey(dateTime) === getDayKey(now) && dateTime < now) {
      return false;
    }

    const candidateStart = dateTime.getTime();
    const candidateEnd = candidateStart + doctorProfile.slotDuration * 60 * 1000;

    return !appointments.some((appointment) => {
      const existingStart = new Date(appointment.dateTime).getTime();
      const existingEnd = existingStart + appointment.duration * 60 * 1000;
      return existingStart < candidateEnd && existingEnd > candidateStart;
    });
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row">
      <DoctorNav />

      <section className="min-w-0 flex-1 space-y-6">
        <header className="space-y-4">
          <h1 className="flex items-center gap-3 text-4xl font-bold text-slate-900">
            <Image src="/icons/windows11-filled/schedule.png" alt="" width={36} height={36} />
            Күндік жоспар
          </h1>
        </header>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Таңдалған күн</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{formatDateLabel(parsedDate)}</h2>
              <p className="mt-2 text-sm text-slate-600">Осы күндегі қабылдауларды қарап, жаңа пациентті қолмен тіркей аласыз.</p>
            </div>
            <Link href="/doctor/schedule" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              ← Күнтізбеге қайту
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">Осы күндегі қабылдаулар</h3>

          {appointments.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">Әлі қабылдау жоқ.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-700 font-semibold">
                    <th className="py-3 px-4">Уақыты</th>
                    <th className="py-3 px-4">Пациент</th>
                    <th className="py-3 px-4">Телефон</th>
                    <th className="py-3 px-4">Түрі</th>
                    <th className="py-3 px-4">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-3 px-4 font-medium text-slate-900">{new Date(item.dateTime).toLocaleTimeString("kk-KZ", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.patient.user.name}</td>
                      <td className="py-3 px-4 text-slate-700">{item.patient.user.phone || "—"}</td>
                      <td className="py-3 px-4 text-slate-700">{getAppointmentTypeLabel(item.type)}</td>
                      <td className="py-3 px-4 text-slate-700">{getAppointmentStatusLabel(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
          {!workingDay && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              Бұл күн сіздің жұмыс күніңіз емес. Жаңа қабылдау тіркеу өшірілген.
            </div>
          )}

          {workingDay && patients.length > 0 && availableSlots.length > 0 && (
            <DayAppointmentForm
              dateKey={params.date}
              patients={patients.map((item) => ({
                id: item.id,
                name: item.user.name,
                email: item.user.email,
                phone: item.user.phone,
              }))}
              availableSlots={availableSlots}
            />
          )}

          {workingDay && availableSlots.length === 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              Бұл күнге бос слот қалмады.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
