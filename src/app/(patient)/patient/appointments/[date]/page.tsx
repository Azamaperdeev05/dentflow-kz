import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePatientPage } from "@/lib/session";
import { DailyAppointmentForm } from "@/components/patient/daily-appointment-form";
import { buildTimeSlots, combineDateAndTime, getDayKey, getMaxAppointmentTypeDurationMinutes, isTimeWithinWorkingHours, isWorkingDay, parseDayKey } from "@/lib/scheduling";

type Props = {
  params: {
    date: string;
  };
  searchParams?: {
    doctorId?: string;
  };
};

function formatSelectedDateLabel(dateKey: string) {
  const parsed = parseDayKey(dateKey);
  if (!parsed) {
    return dateKey;
  }

  return new Intl.DateTimeFormat("kk-KZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export default async function AppointmentDayPage({ params, searchParams }: Props) {
  await requirePatientPage();

  const selectedDate = params.date;
  const doctorId = searchParams?.doctorId;
  const parsedDate = parseDayKey(selectedDate);

  if (!parsedDate) {
    notFound();
  }

  const startOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
  const endOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate() + 1);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isPastDay = startOfDay.getTime() < todayStart.getTime();

  const [doctors, dayAppointments] = await Promise.all([
    prisma.doctorProfile.findMany({
      where: { 
        isAvailable: true,
        ...(doctorId ? { id: doctorId } : {})
      },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.appointment.findMany({
      where: {
        dateTime: { gte: startOfDay, lt: endOfDay },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: {
        doctorId: true,
        dateTime: true,
        duration: true,
      },
    }),
  ]);

  const doctorsForDay = doctors
    .filter((doctor) => isWorkingDay(doctor.workDays, parsedDate))
    .map((doctor) => {
      const bookedIntervals = dayAppointments.filter((appointment) => appointment.doctorId === doctor.id);
      const availabilitySpanMinutes = getMaxAppointmentTypeDurationMinutes(doctor.slotDuration);
      const slots = buildTimeSlots(doctor.workHoursStart, doctor.workHoursEnd, doctor.slotDuration).filter((time) => {
        const dateTime = combineDateAndTime(selectedDate, time);
        if (!dateTime) {
          return false;
        }

        const now = new Date();
        if (dateTime < now) {
          return false;
        }

        if (!isTimeWithinWorkingHours(time, doctor.workHoursStart, doctor.workHoursEnd, doctor.slotDuration)) {
          return false;
        }

        const candidateStart = dateTime.getTime();
        const candidateEnd = candidateStart + availabilitySpanMinutes * 60 * 1000;

        return !bookedIntervals.some((appointment) => {
          const existingStart = new Date(appointment.dateTime).getTime();
          const existingEnd = existingStart + appointment.duration * 60 * 1000;
          return existingStart < candidateEnd && existingEnd > candidateStart;
        });
      });

      return {
        id: doctor.id,
        name: doctor.user.name,
        specialization: (() => {
          try {
            const specs = JSON.parse(doctor.specializations || "[]") as string[];
            return specs.join(", ") || "—";
          } catch {
            return "—";
          }
        })(),
        workHoursStart: doctor.workHoursStart,
        workHoursEnd: doctor.workHoursEnd,
        slotDuration: doctor.slotDuration,
        slots,
      };
    })
    .filter((doctor) => doctor.slots.length > 0);

  return (
    <main className="flex min-h-[calc(100vh-8rem)] w-full flex-col gap-6 py-4">
        <header className="space-y-4">
          <h1 className="flex items-center gap-3 text-4xl font-bold text-slate-900">
            <Image src="/icons/windows11-filled/calendar.png" alt="" width={36} height={36} />
            Жазылу күні
          </h1>
        </header>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700">Таңдалған күн</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">{formatSelectedDateLabel(selectedDate)}</h2>
            </div>
            <Link 
              href={doctorId ? `/patient/appointments?doctorId=${doctorId}` : "/patient/appointments"} 
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← Күнтізбеге қайту
            </Link>
          </div>

          <div className="mt-6">
            {isPastDay ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                Өткен күнге жазылуға болмайды. Бүгінгі немесе келесі күнді таңдаңыз.
              </div>
            ) : doctorsForDay.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                Бұл күнге жұмыс істейтін немесе бос уақыттары бар дәрігер табылмады. Басқа күнді таңдаңыз.
              </div>
            ) : (
              <DailyAppointmentForm selectedDate={selectedDate} doctors={doctorsForDay} />
            )}
          </div>
        </section>
    </main>
  );
}
