"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  treatmentId: string;
  approved: boolean;
};

export function ApproveTreatmentButton({ treatmentId, approved }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(value: boolean) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/patient/treatments/${treatmentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: value }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Жоспарды бекіту сәтсіз аяқталды");
        return;
      }

      router.refresh();
    } catch {
      setError("Сервер қатесі");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {!approved && (
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            Жоспарды бекіту
          </button>
        )}
        {approved && (
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={loading}
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
          >
            Бекітуді алып тастау
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
