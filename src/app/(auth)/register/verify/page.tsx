"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function RegisterVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const email = useMemo(() => {
    if (queryEmail) {
      return queryEmail;
    }

    if (typeof window === "undefined") {
      return "";
    }

    const raw = sessionStorage.getItem("register_pending_credentials");
    if (!raw) {
      return "";
    }

    try {
      const parsed = JSON.parse(raw) as { email?: string };
      return parsed.email ?? "";
    } catch {
      return "";
    }
  }, [queryEmail]);

  async function handleVerify() {
    if (!email) {
      setError("Email табылмады. Қайта тіркеліп көріңіз.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsVerifying(true);

    try {
      const response = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(result.error ?? "Код растау сәтсіз");
        return;
      }

      setSuccess(result.message ?? "Email сәтті расталды. Кіру орындалып жатыр...");

      let pendingPassword = "";
      if (typeof window !== "undefined") {
        const raw = sessionStorage.getItem("register_pending_credentials");
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as { email?: string; password?: string };
            if (parsed.email === email) {
              pendingPassword = parsed.password ?? "";
            }
          } catch {
            pendingPassword = "";
          }
        }
      }

      if (!pendingPassword) {
        router.push("/login");
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password: pendingPassword,
        redirect: false,
      });

      if (!signInResult || signInResult.error) {
        router.push("/login");
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("register_pending_credentials");
      }

      router.push("/auth-redirect");
      router.refresh();
    } finally {
      setIsVerifying(false);
    }
  }

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
            <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-900">Email растау</h2>
            <p className="mt-2 text-slate-600">Email-ге келген 6 таңбалы OTP кодын енгізіңіз</p>
          </div>

          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Email</span>
              <input
                value={email}
                readOnly
                className="h-14 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-slate-700"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">OTP код</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              />
            </label>

            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            {success && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

            <button
              type="button"
              onClick={handleVerify}
              disabled={code.length !== 6 || isVerifying}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 font-semibold text-white transition hover:shadow-lg disabled:opacity-70"
            >
              {isVerifying ? "Тексерілуде..." : "Кодты растау"}
            </button>
          </div>

          <div className="mt-5 text-center text-sm text-slate-600">
            Код келмеді ме?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Қайта тіркелу
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function RegisterVerifyPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
      <RegisterVerifyContent />
    </Suspense>
  );
}
