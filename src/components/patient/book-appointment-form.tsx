"use client";

import { useEffect, useMemo, useState } from "react";
import { MonthCalendar } from "@/components/shared/month-calendar";

type DoctorOption = {
  id: string;
  name: string;
  specialization: string;
};

type Props = {
  doctors: DoctorOption[];
  busyDoctorIdsByDate?: Record<string, string[]>;
};

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function BookAppointmentForm({ doctors, busyDoctorIdsByDate = {} }: Props) {
  const today = new Date();
  const thisMonthYear = today.getFullYear();
  const thisMonthIndex = today.getMonth();

  const [doctorProfileId, setDoctorProfileId] = useState(doctors[0]?.id ?? "");
  const [date, setDate] = useState(formatDateKey(today));
  const [time, setTime] = useState("");
  const [type, setType] = useState("CONSULTATION");
  const [complaint, setComplaint] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableDoctors = useMemo(() => {
    const busySet = new Set(busyDoctorIdsByDate[date] ?? []);
    return doctors.filter((doctor) => !busySet.has(doctor.id));
  }, [date, doctors, busyDoctorIdsByDate]);

  useEffect(() => {
    if (!availableDoctors.length) {
      setDoctorProfileId("");
      return;
    }

    if (!availableDoctors.some((doctor) => doctor.id === doctorProfileId)) {
      setDoctorProfileId(availableDoctors[0].id);
    }
  }, [availableDoctors, doctorProfileId]);

  const isDisabled = useMemo(() => loading || !doctorProfileId || !date || !time, [loading, doctorProfileId, date, time]);

  const calendarMarkers = useMemo(() => {
    const result: Record<string, { isUnavailableDay?: boolean }> = {};
    const daysInMonth = new Date(thisMonthYear, thisMonthIndex + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dayKey = formatDateKey(new Date(thisMonthYear, thisMonthIndex, day));
      const busyCount = (busyDoctorIdsByDate[dayKey] ?? []).length;
      if (busyCount >= doctors.length) {
        result[dayKey] = { isUnavailableDay: true };
      }
    }

    return result;
  }, [busyDoctorIdsByDate, doctors.length, thisMonthYear, thisMonthIndex]);

  async function submit() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const dateTime = new Date(`${date}T${time}:00`).toISOString();
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorProfileId, dateTime, type, complaint }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Қате орын алды");
        return;
      }

      setMessage("Қабылдау сәтті брондалды");
      setComplaint("");
    } catch {
      setError("Желі қатесі");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold text-slate-900">Қабылдауға жазылу</h2>

      <div className="mt-4 space-y-3">
        <MonthCalendar
          year={thisMonthYear}
          month={thisMonthIndex}
          selectedDate={date}
          markers={calendarMarkers}
          onSelectDate={(selected) => setDate(selected)}
        />
        <p className="text-xs text-slate-600">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" />Демалыс немесе бос орын жоқ күн</span>
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Дәрігер</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={doctorProfileId}
            onChange={(e) => setDoctorProfileId(e.target.value)}
          >
            {availableDoctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} - {doctor.specialization}
              </option>
            ))}
          </select>
          {!availableDoctors.length && (
            <span className="mt-1 block text-xs text-amber-700">Бұл күні бос дәрігер табылмады. Басқа күнді таңдаңыз.</span>
          )}
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Қабылдау түрі</span>
          <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="CONSULTATION">Консультация</option>
            <option value="CHECKUP">Тексеру</option>
            <option value="TREATMENT">Емдеу</option>
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Күні</span>
          <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Уақыты</span>
          <input type="time" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>

        <label className="text-sm text-slate-700 md:col-span-2">
          <span className="mb-1 block">Шағым</span>
          <textarea
            className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Мысалы: тіс ауырады, сезімталдық жоғары..."
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}

      <button
        type="button"
        disabled={isDisabled}
        onClick={submit}
        className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white hover:bg-cyan-700 disabled:opacity-60"
      >
        {loading ? "Жіберілуде..." : "Брондау"}
      </button>
    </section>
  );
}
