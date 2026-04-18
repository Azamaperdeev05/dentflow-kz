"use client";

import Image from "next/image";
import { useState } from "react";

type SetupPayload = {
  manualKey: string;
  qrDataUrl: string;
};

type Props = {
  initialEnabled: boolean;
};

export function TwoFactorSettings({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [setupData, setSetupData] = useState<SetupPayload | null>(null);
  const [enableCode, setEnableCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const startSetup = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/two-factor/setup", {
        method: "POST",
      });

      const data = (await response.json()) as { error?: string; manualKey?: string; qrDataUrl?: string };
      if (!response.ok || !data.manualKey || !data.qrDataUrl) {
        setError(data.error ?? "2FA баптауын бастау сәтсіз аяқталды");
        return;
      }

      setSetupData({ manualKey: data.manualKey, qrDataUrl: data.qrDataUrl });
      setSuccess("QR код дайын. Google Authenticator-ға қосып, 6 таңбалы кодпен растаңыз.");
    } catch {
      setError("Серверге қосылу қатесі");
    } finally {
      setLoading(false);
    }
  };

  const confirmEnable = async () => {
    setError(null);
    setSuccess(null);

    if (!/^\d{6}$/.test(enableCode)) {
      setError("Код 6 таңбалы болуы керек");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/two-factor/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: enableCode }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "2FA қосу сәтсіз аяқталды");
        return;
      }

      setEnabled(true);
      setSetupData(null);
      setEnableCode("");
      setSuccess("2FA сәтті қосылды. Енді жүйеге кіру кезінде код сұралады.");
    } catch {
      setError("Серверге қосылу қатесі");
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    setError(null);
    setSuccess(null);

    if (!/^\d{6}$/.test(disableCode)) {
      setError("Өшіру үшін 6 таңбалы код енгізіңіз");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/two-factor/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "2FA өшіру сәтсіз аяқталды");
        return;
      }

      setEnabled(false);
      setDisableCode("");
      setSuccess("2FA сәтті өшірілді.");
    } catch {
      setError("Серверге қосылу қатесі");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Google Authenticator (2FA)</h2>
      <p className="mt-1 text-sm text-slate-600">Қоссаңыз, кіру кезінде құпиясөзден бөлек 6 таңбалы код енгізесіз.</p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <span className="font-semibold text-slate-800">Күйі:</span>{" "}
        <span className={enabled ? "font-semibold text-emerald-700" : "font-semibold text-slate-600"}>
          {enabled ? "Қосулы" : "Өшірулі"}
        </span>
      </div>

      {!enabled && !setupData && (
        <div className="mt-4">
          <button
            type="button"
            onClick={startSetup}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-70"
          >
            {loading ? "Дайындалуда..." : "2FA қосуды бастау"}
          </button>
        </div>
      )}

      {!enabled && setupData && (
        <div className="mt-4 space-y-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
          <p className="text-sm text-slate-700">1. Google Authenticator қолданбасымен QR кодты сканерлеңіз.</p>
          <Image
            src={setupData.qrDataUrl}
            alt="2FA QR"
            width={176}
            height={176}
            unoptimized
            className="h-44 w-44 rounded-lg border border-slate-200 bg-white p-1"
          />
          <div>
            <p className="text-sm font-semibold text-slate-700">QR ашылмаса, қолмен кілт:</p>
            <p className="mt-1 break-all rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">{setupData.manualKey}</p>
          </div>
          <div>
            <p className="mb-1 text-sm font-semibold text-slate-700">2. Қолданбадағы 6 таңбалы код</p>
            <input
              value={enableCode}
              onChange={(event) => setEnableCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="123456"
              className="h-11 w-40 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmEnable}
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70"
            >
              {loading ? "Тексерілуде..." : "Растап қосу"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSetupData(null);
                setEnableCode("");
                setError(null);
                setSuccess(null);
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Болдырмау
            </button>
          </div>
        </div>
      )}

      {enabled && (
        <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-slate-700">2FA өшіру үшін Google Authenticator-дағы ағымдағы кодты енгізіңіз.</p>
          <input
            value={disableCode}
            onChange={(event) => setDisableCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="123456"
            className="h-11 w-40 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
          <div>
            <button
              type="button"
              onClick={disableTwoFactor}
              disabled={loading}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-70"
            >
              {loading ? "Өшірілуде..." : "2FA өшіру"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
    </section>
  );
}
