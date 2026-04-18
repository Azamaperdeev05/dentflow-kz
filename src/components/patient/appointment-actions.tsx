"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  appointmentId: string;
  appointmentDateTime: string;
  canManage: boolean;
};

function toDatetimeLocalValue(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function AppointmentActions({ appointmentId, appointmentDateTime, canManage }: Props) {
  const router = useRouter();
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDateTime, setRescheduleDateTime] = useState(toDatetimeLocalValue(appointmentDateTime));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Бас тарту сәтсіз аяқталды");
        return;
      }

      router.refresh();
    } catch {
      setError("Сервер қатесі");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESCHEDULE", dateTime: new Date(rescheduleDateTime).toISOString() }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Ауыстыру сәтсіз аяқталды");
        return;
      }

      setShowReschedule(false);
      router.refresh();
    } catch {
      setError("Сервер қатесі");
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
        >
          Бас тарту
        </button>
        <button
          type="button"
          onClick={() => setShowReschedule((prev) => !prev)}
          className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100"
        >
          Ауыстыру
        </button>
      </div>

      {showReschedule && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="block text-xs font-semibold text-slate-700">
            Жаңа күн мен уақыт
            <input
              type="datetime-local"
              value={rescheduleDateTime}
              onChange={(event) => setRescheduleDateTime(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={handleReschedule}
            disabled={loading}
            className="mt-2 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
          >
            {loading ? "Сақталуда..." : "Ауыстыруды сақтау"}
          </button>
        </div>
      )}

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
