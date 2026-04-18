"use client";

import { useState } from "react";
import { getAppointmentStatusLabel } from "@/lib/kz-labels";

type Props = {
  appointmentId: string;
  currentStatus: string;
};

const statuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;

export function ScheduleStatusActions({ appointmentId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function updateStatus(nextStatus: string) {
    setLoading(true);
    setMessage(null);

    const res = await fetch(`/api/doctor/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error ?? "Статусты өзгерту сәтсіз");
      setLoading(false);
      return;
    }

    setStatus(nextStatus);
    setMessage("Сақталды");
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <select
        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        disabled={loading}
      >
        {statuses.map((item) => (
          <option key={item} value={item}>
            {getAppointmentStatusLabel(item)}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={loading}
        onClick={() => updateStatus(status)}
        className="block rounded-md bg-cyan-600 px-3 py-1 text-xs text-white hover:bg-cyan-700 disabled:opacity-60"
      >
        {loading ? "..." : "Жаңарту"}
      </button>
      {message && <p className="text-xs text-slate-500">{message}</p>}
    </div>
  );
}
