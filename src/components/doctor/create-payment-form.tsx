"use client";

import { useState } from "react";

type TreatmentOption = {
  id: string;
  title: string;
  totalCost: number;
  paidAmount: number;
};

type Props = {
  treatments: TreatmentOption[];
};

export function CreatePaymentForm({ treatments }: Props) {
  const [treatmentId, setTreatmentId] = useState(treatments[0]?.id ?? "");
  const [amount, setAmount] = useState("0");
  const [method, setMethod] = useState("CASH");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedTreatment = treatments.find((item) => item.id === treatmentId) ?? treatments[0];
  const remaining = selectedTreatment ? Math.max(selectedTreatment.totalCost - selectedTreatment.paidAmount, 0) : 0;

  async function submit() {
    setLoading(true);
    setMessage(null);

    const amountNumber = Number(amount);
    if (amountNumber <= 0) {
      setMessage("Төлем сомасы 0-ден жоғары болуы керек");
      setLoading(false);
      return;
    }

    if (remaining > 0 && amountNumber > remaining) {
      setMessage("Төлем сомасы қарыз қалдығынан артық болмауы керек");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/doctor/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        treatmentId,
        amount: amountNumber,
        method,
        note,
      }),
    });

    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error ?? "Төлемді тіркеу сәтсіз");
      setLoading(false);
      return;
    }

    setMessage("Төлем тіркелді");
    setAmount("0");
    setNote("");
    setLoading(false);
  }

  if (treatments.length === 0) {
    return (
      <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Төлем тіркеу</h2>
        <p className="mt-2 text-sm text-slate-500">Төлем жасау үшін алдымен емдеу жоспары болуы керек.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-slate-900">Төлем тіркеу</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm text-slate-700 md:col-span-2">
          <span className="mb-1 block">Емдеу</span>
          <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)}>
            {treatments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Сома</span>
          <input
            type="number"
            min={0}
            max={remaining || undefined}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <span className="mt-1 block text-xs text-slate-500">Қалған сома: {remaining.toLocaleString("kk-KZ")} ₸</span>
        </label>
        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Әдіс</span>
          <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="CASH">Касса</option>
            <option value="CARD">Карта</option>
            <option value="TRANSFER">Аударым</option>
          </select>
        </label>
        <label className="text-sm text-slate-700 md:col-span-2">
          <span className="mb-1 block">Ескерту</span>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>

      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}

      <button type="button" disabled={loading} onClick={submit} className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700 disabled:opacity-60">
        {loading ? "Сақталуда..." : "Төлем қосу"}
      </button>
    </section>
  );
}
