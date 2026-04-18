"use client";

import { useState } from "react";
import { TreatmentToothChart } from "./treatment-tooth-chart";
import { getTreatmentStatusLabel } from "@/lib/kz-labels";

type StageInput = {
  title: string;
  cost: string;
};

type Props = {
  patientProfileId: string;
};

export function CreateTreatmentForm({ patientProfileId }: Props) {
  const [diagnosis, setDiagnosis] = useState("Емдеу жоспары");
  const [status, setStatus] = useState("ACTIVE");
  const [stages, setStages] = useState<StageInput[]>([{ title: "", cost: "0" }]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalCost = stages.reduce((sum, stage) => sum + (Number(stage.cost) || 0), 0);

  function updateStage(index: number, patch: Partial<StageInput>) {
    setStages((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  }

  function addStage() {
    setStages((prev) => [...prev, { title: "", cost: "0" }]);
  }

  function removeStage(index: number) {
    setStages((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)));
  }

  async function submit() {
    setLoading(true);
    setMessage(null);

    const normalizedStages = stages
      .map((item) => ({
        title: item.title.trim(),
        cost: Number(item.cost) || 0,
      }))
      .filter((item) => item.title.length > 0);

    if (normalizedStages.length === 0) {
      setMessage("Кемінде бір емдеу кезеңін толтырыңыз");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/doctor/treatments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientProfileId,
        diagnosis,
        stages: normalizedStages,
        totalCost,
        status,
      }),
    });

    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error ?? "Сақтау қатесі");
      setLoading(false);
      return;
    }

    setMessage("Емдеу жоспары сақталды");
    setDiagnosis("Емдеу жоспары");
    setStages([{ title: "", cost: "0" }]);
    setLoading(false);
  }

  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-slate-900">Жаңа емдеу жоспары</h2>
      
      {/* Tooth Chart */}
      <div className="mt-4">
        <TreatmentToothChart treatmentProcedures="[]" />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <label className="text-sm text-slate-700 md:col-span-2">
          <span className="mb-1 block">Диагноз</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </label>

        <div className="md:col-span-2 space-y-2">
          <span className="block text-sm text-slate-700">Кезең-кезеңімен емдеу</span>
          {stages.map((stage, index) => (
            <div key={`stage-${index}`} className="grid gap-2 md:grid-cols-[1fr_160px_auto]">
              <input
                placeholder={`Кезең ${index + 1} атауы`}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={stage.title}
                onChange={(e) => updateStage(index, { title: e.target.value })}
              />
              <input
                type="number"
                min={0}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={stage.cost}
                onChange={(e) => updateStage(index, { cost: e.target.value })}
              />
              <button
                type="button"
                onClick={() => removeStage(index)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Өшіру
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addStage}
            className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100"
          >
            + Кезең қосу
          </button>
        </div>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Жалпы құн</span>
          <input type="number" min={0} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-slate-50" value={totalCost} readOnly />
        </label>
        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Статус</span>
          <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">{getTreatmentStatusLabel("ACTIVE")}</option>
            <option value="COMPLETED">{getTreatmentStatusLabel("COMPLETED")}</option>
            <option value="PAUSED">{getTreatmentStatusLabel("PAUSED")}</option>
          </select>
        </label>
      </div>

      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}

      <button type="button" disabled={loading} onClick={submit} className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700 disabled:opacity-60">
        {loading ? "Сақталуда..." : "Сақтау"}
      </button>
    </section>
  );
}
