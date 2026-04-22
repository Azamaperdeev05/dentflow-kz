"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Step = "credentials" | "code" | "done";

export default function Forgot2FAPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleCredentialsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);

    if (!email || !password) {
      setServerError("Email мен құпия сөзді енгізіңіз");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/two-factor/recovery-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setServerError(data.error ?? "Қате орын алды");
        return;
      }

      setStep("code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);

    if (!/^\d{6}$/.test(code)) {
      setServerError("Код 6 цифрдан тұруы керек");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/two-factor/recovery-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setServerError(data.error ?? "Қате орын алды");
        return;
      }

      setStep("done");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-cyan-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="mx-auto w-full max-w-2xl">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 lg:p-10">
          <div className="text-center lg:text-left">
            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl lg:mx-0">
              <Image src="/logo.png" alt="DentFlow KZ" width={60} height={60} className="object-contain" />
            </div>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
              {step === "done" ? "2FA өшірілді ✅" : "2FA кодын қалпына келтіру"}
            </h2>
            <p className="mt-2 text-slate-600">
              {step === "credentials" && "Email мен құпия сөзіңізді растаңыз — кодты почтаға жіберміз"}
              {step === "code" && `${email} почтасына 6 таңбалы код жіберілді`}
              {step === "done" && "Енді жүйеге 2FA-сыз кіре аласыз. Қауіпсіздік үшін кіргеннен кейін 2FA-ны қайта қосуды ұсынамыз."}
            </p>
          </div>

          {step === "credentials" && (
            <form onSubmit={handleCredentialsSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Email</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-blue-600">✉️</span>
                  <input
                    type="email"
                    placeholder="Email енгізіңіз"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Құпиясөз</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-blue-600">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Құпиясөз енгізіңіз"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-24 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    {showPassword ? "Жасыру" : "Көрсету"}
                  </button>
                </div>
              </label>

              {serverError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 font-semibold text-white transition hover:shadow-lg disabled:opacity-70"
              >
                {isSubmitting ? "Тексерілуде..." : "Код жіберу"}
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleCodeSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Email-дегі 6 таңбалы код</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  autoFocus
                />
              </label>

              {serverError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || code.length !== 6}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 font-semibold text-white transition hover:shadow-lg disabled:opacity-70"
              >
                {isSubmitting ? "Тексерілуде..." : "Растау"}
              </button>

              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                ← Артқа
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="mt-8">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 font-semibold text-white transition hover:shadow-lg"
              >
                Кіру бетіне өту
              </button>
            </div>
          )}

          {step !== "done" && (
            <div className="mt-6 text-center text-sm text-slate-500">
              <Link href="/login" className="font-medium text-slate-600 hover:text-cyan-700">
                Кіру бетіне оралу
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
