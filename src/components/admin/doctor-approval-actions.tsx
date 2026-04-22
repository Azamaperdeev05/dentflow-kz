"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  userId: string;
  doctorName: string;
  currentStatus: string | null;
};

export function DoctorApprovalActions({ userId, doctorName, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleApprove = async () => {
    setLoading("approve");
    try {
      const res = await fetch(`/api/admin/doctors/${userId}/approve`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "Қате орын алды");
      }
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading("reject");
    try {
      const res = await fetch(`/api/admin/doctors/${userId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason || undefined }),
      });
      if (res.ok) {
        setShowRejectModal(false);
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "Қате орын алды");
      }
    } finally {
      setLoading(null);
    }
  };

  if (currentStatus === "APPROVED") {
    return <span className="text-sm font-semibold text-emerald-600">✅ Бекітілді</span>;
  }

  if (currentStatus === "REJECTED") {
    return <span className="text-sm font-semibold text-red-500">❌ Қабылданбады</span>;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={loading !== null}
          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
        >
          {loading === "approve" ? "..." : "Бекіту"}
        </button>
        <button
          type="button"
          onClick={() => setShowRejectModal(true)}
          disabled={loading !== null}
          className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
        >
          Қабылдамау
        </button>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Өтінімді қабылдамау</h3>
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-semibold">{doctorName}</span> — тіркелу өтінімін қабылдамайсыз ба?
            </p>
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-slate-700">Себеп (міндетті емес)</span>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                maxLength={500}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                placeholder="Қабылданбау себебін жазыңыз..."
              />
            </label>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Болдырмау
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={loading !== null}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {loading === "reject" ? "..." : "Қабылдамау"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
