"use client";

import { useEffect, useMemo, useState } from "react";
import { uiFeedback } from "@/lib/ui-feedback";

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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

  async function submitConfirmed() {
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
        setError(data.error ?? uiFeedback.genericError);
        return;
      }

      setMessage(uiFeedback.bookingSuccess);
      setComplaint("");
      setIsConfirmOpen(false);
    } catch {
      setError(uiFeedback.networkError);
    } finally {
      setLoading(false);
    }
  }

  function openConfirm() {
    setError(null);
    setMessage(null);

    if (!doctorProfileId || !time) {
      setError(uiFeedback.genericError);
      return;
    }

    setIsConfirmOpen(true);
  }

  return (
    <div className="mx-auto max-w-2xl w-full">
      <section className="rounded-3xl bg-white p-6 md:p-8 ring-1 ring-slate-200 shadow-xl shadow-slate-200/50">
        <div className="mb-6 flex flex-col gap-1 border-b border-slate-100 pb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600">Дәрігер</p>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
              <span className="text-sm font-bold">{selectedDoctor?.name.charAt(0)}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{selectedDoctor?.name}</h3>
              <p className="text-xs text-slate-500">{selectedDoctor?.specialization}</p>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-900">Жазылу уақыты</h3>
        <div className="mt-8 space-y-8">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Уақытты таңдаңыз</h4>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md ring-1 ring-slate-100">
                {selectedDoctor?.slots.length} слот бос
              </span>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {selectedDoctor?.slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`rounded-xl py-3 text-sm font-bold transition-all ${
                    time === slot
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-200 ring-2 ring-cyan-600 ring-offset-2"
                      : "bg-slate-50 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 border border-slate-100"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="group block">
              <span className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-cyan-600 transition-colors">Қабылдау түрі</span>
              <select 
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-all focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none hover:border-slate-300" 
                value={type} 
                onChange={(e) => setType(e.target.value)}
              >
                <option value="CONSULTATION">Консультация</option>
                <option value="CHECKUP">Тексеру</option>
                <option value="TREATMENT">Емдеу</option>
                <option value="EMERGENCY">Шұғыл қабылдау</option>
              </select>
              <div className="mt-2 flex items-center gap-1.5 px-1">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span className="text-[10px] font-bold text-slate-400">
                  {getTypeLabel(type)}: {selectedDoctor ? getTypeDurationLabel(type, selectedDoctor.slotDuration) : "—"}
                </span>
              </div>
            </label>

            <label className="group block">
              <span className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-cyan-600 transition-colors">Шағым (міндетті емес)</span>
              <textarea
                className="h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition-all focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none hover:border-slate-300 resize-none"
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="Мысалы: тіс ауырады..."
              />
            </label>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}

        <button
          type="button"
          disabled={isDisabled}
          onClick={openConfirm}
          className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white hover:bg-cyan-700 disabled:opacity-60"
        >
          {loading ? "Жіберілуде..." : "Брондау"}
        </button>
      </section>

      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
            <h4 className="text-lg font-bold text-slate-900">Жазылуды растаңыз</h4>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold">Дәрігер:</span> {selectedDoctor?.name ?? "—"}</p>
              <p><span className="font-semibold">Күні:</span> {selectedDate}</p>
              <p><span className="font-semibold">Уақыты:</span> {time}</p>
              <p><span className="font-semibold">Түрі:</span> {getTypeLabel(type)}</p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Болдырмау
              </button>
              <button
                type="button"
                onClick={submitConfirmed}
                disabled={loading}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-70"
              >
                {loading ? "Жіберілуде..." : "Растау"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
