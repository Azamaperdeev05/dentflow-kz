"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PatientOption = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

type Props = {
  dateKey: string;
  patients: PatientOption[];
  availableSlots: string[];
};

export function DayAppointmentForm({ dateKey, patients, availableSlots }: Props) {
  const router = useRouter();
  const [patientProfileId, setPatientProfileId] = useState(patients[0]?.id ?? "");
  const [time, setTime] = useState(availableSlots[0] ?? "");
  const [type, setType] = useState("CONSULTATION");
  const [complaint, setComplaint] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("Сізге дәрігер жаңа қабылдау тағайындады.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === patientProfileId),
    [patientProfileId, patients],
  );

  const canSubmit = Boolean(patientProfileId && time && availableSlots.length > 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      setError("Пациент пен уақытты таңдаңыз.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/doctor/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientProfileId,
          date: dateKey,
          time,
          type,
          complaint,
          notifyMessage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error ?? "Қабылдауды тіркеу кезінде қате пайда болды.");
        return;
      }

      setSuccess("Қабылдау сәтті тіркелді және пациентке хабарлама жіберілді.");
      setComplaint("");
      router.refresh();
    } catch {
      setError("Серверге қосылу қатесі.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Пациентке қабылдау тағайындау</h3>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-slate-700">Пациент</span>
          <select
            value={patientProfileId}
            onChange={(event) => setPatientProfileId(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name} ({patient.phone || patient.email})
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-semibold text-slate-700">Уақыт</span>
          <select
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {availableSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-semibold text-slate-700">Қабылдау түрі</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="CONSULTATION">Консультация</option>
            <option value="CHECKUP">Тексеру</option>
            <option value="TREATMENT">Емдеу</option>
            <option value="EMERGENCY">Шұғыл қабылдау</option>
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-semibold text-slate-700">Пациентке хабарлама</span>
          <input
            value={notifyMessage}
            onChange={(event) => setNotifyMessage(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Хабарлама мәтіні"
          />
        </label>
      </div>

      <label className="mt-4 block space-y-2 text-sm">
        <span className="font-semibold text-slate-700">Шағым/ескерту</span>
        <textarea
          value={complaint}
          onChange={(event) => setComplaint(event.target.value)}
          className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Мысалы: тіс ауыруы, тексеру қажет..."
        />
      </label>

      {selectedPatient && (
        <p className="mt-3 text-xs text-slate-600">
          Таңдалған пациент: <span className="font-semibold text-slate-800">{selectedPatient.name}</span>
        </p>
      )}

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
      {success && <p className="mt-3 text-sm font-medium text-emerald-600">{success}</p>}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="mt-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Сақталуда..." : "Қабылдауды тіркеу және хабарлау"}
      </button>
    </form>
  );
}
