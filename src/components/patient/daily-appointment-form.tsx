"use client";

import { useEffect, useMemo, useState } from "react";

function getTypeLabel(type: string) {
  if (type === "CHECKUP") {
    return "Тексеру";
  }

  if (type === "TREATMENT") {
    return "Емдеу";
  }

  if (type === "EMERGENCY") {
    return "Шұғыл қабылдау";
  }

  return "Консультация";
}

function getTypeDurationLabel(type: string, slotDuration: number) {
  const minutes = type === "TREATMENT" || type === "EMERGENCY" ? slotDuration * 2 : slotDuration;
  return `${minutes} мин`;
}

type DoctorSlot = {
  id: string;
  name: string;
  specialization: string;
  workHoursStart: string;
  workHoursEnd: string;
  slotDuration: number;
  slots: string[];
};

type Props = {
  selectedDate: string;
  doctors: DoctorSlot[];
};

export function DailyAppointmentForm({ selectedDate, doctors }: Props) {
  const [doctorProfileId, setDoctorProfileId] = useState(doctors[0]?.id ?? "");
  const [time, setTime] = useState(doctors[0]?.slots[0] ?? "");
  const [type, setType] = useState("CONSULTATION");
  const [complaint, setComplaint] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedDoctor = useMemo(() => doctors.find((doctor) => doctor.id === doctorProfileId) ?? doctors[0], [doctorProfileId, doctors]);

  useEffect(() => {
    if (!selectedDoctor) {
      setDoctorProfileId("");
      setTime("");
      return;
    }

    if (selectedDoctor.id !== doctorProfileId) {
      setDoctorProfileId(selectedDoctor.id);
    }

    if (!selectedDoctor.slots.includes(time)) {
      setTime(selectedDoctor.slots[0] ?? "");
    }
  }, [selectedDoctor, doctorProfileId, time]);

  const isDisabled = loading || !doctorProfileId || !time;

  async function submit() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorProfileId,
          date: selectedDate,
          time,
          type,
          complaint,
        }),
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
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
        <h3 className="text-lg font-bold text-slate-900">Дәрігерді таңдаңыз</h3>
        <div className="mt-4 space-y-3">
          {doctors.map((doctor) => (
            <button
              key={doctor.id}
              type="button"
              onClick={() => setDoctorProfileId(doctor.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                doctor.id === doctorProfileId
                  ? "border-cyan-500 bg-cyan-50"
                  : "border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/40"
              }`}
            >
              <p className="font-semibold text-slate-900">{doctor.name}</p>
              <p className="mt-1 text-sm text-slate-600">{doctor.specialization}</p>
              <p className="mt-2 text-xs text-slate-500">
                Жұмыс уақыты: {doctor.workHoursStart} - {doctor.workHoursEnd} · {doctor.slotDuration} мин
              </p>
              <p className="mt-1 text-xs font-semibold text-cyan-700">Қолжетімді уақыт: {doctor.slots.length}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Жазылу уақыты</h3>
        <div className="mt-4 grid gap-4">
          <label className="text-sm text-slate-700">
            <span className="mb-1 block font-medium">Уақыт</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            >
              {selectedDoctor?.slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-700">
            <span className="mb-1 block font-medium">Қабылдау түрі</span>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="CONSULTATION">Консультация</option>
              <option value="CHECKUP">Тексеру</option>
              <option value="TREATMENT">Емдеу</option>
              <option value="EMERGENCY">Шұғыл қабылдау</option>
            </select>
            <span className="mt-1 block text-xs text-slate-500">
              {getTypeLabel(type)} үшін ұзақтығы: {selectedDoctor ? getTypeDurationLabel(type, selectedDoctor.slotDuration) : "—"}
            </span>
          </label>

          <label className="text-sm text-slate-700">
            <span className="mb-1 block font-medium">Шағым</span>
            <textarea
              className="h-28 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Мысалы: тіс ауырады, тексеру керек..."
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
    </div>
  );
}
