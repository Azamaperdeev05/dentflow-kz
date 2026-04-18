"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    if (!requiresTwoFactor) {
      const precheckResponse = await fetch("/api/auth/login/two-factor-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const precheckData = (await precheckResponse.json()) as { error?: string; requiresTwoFactor?: boolean };

      if (!precheckResponse.ok) {
        setServerError(precheckData.error ?? "Email немесе құпиясөз қате");
        return;
      }

      if (precheckData.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setServerError("Google Authenticator кодын енгізіңіз");
        return;
      }
    }

    if (requiresTwoFactor && !/^\d{6}$/.test(twoFactorCode)) {
      setServerError("Google Authenticator коды 6 таңбалы болуы керек");
      return;
    }

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      ...(requiresTwoFactor ? { totpCode: twoFactorCode } : {}),
      redirect: false,
    });

    if (!result || result.error) {
      setServerError(requiresTwoFactor ? "2FA код қате" : "Email немесе құпиясөз қате");
      return;
    }

    router.push("/auth-redirect");
    router.refresh();
  });

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
            <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-900">Кіру</h2>
            <p className="mt-2 text-slate-600">Аккаунтыңызға кіру үшін email мен құпиясөзді енгізіңіз</p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Email</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-blue-600">✉️</span>
                <input
                  type="email"
                  placeholder="Email енгізіңіз"
                  className="h-14 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  {...register("email", {
                    onChange: () => {
                      setRequiresTwoFactor(false);
                      setTwoFactorCode("");
                    },
                  })}
                />
              </div>
              {errors.email && <span className="mt-1 block text-sm text-red-600">{errors.email.message}</span>}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Құпиясөз</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-blue-600">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Құпиясөз енгізіңіз"
                  className="h-14 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-24 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  {...register("password", {
                    onChange: () => {
                      setRequiresTwoFactor(false);
                      setTwoFactorCode("");
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {showPassword ? "Жасыру" : "Көрсету"}
                </button>
              </div>
              {errors.password && <span className="mt-1 block text-sm text-red-600">{errors.password.message}</span>}
            </label>

            {requiresTwoFactor && (
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Google Authenticator коды</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6 таңбалы код"
                  className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                />
              </label>
            )}

            {serverError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 font-semibold text-white transition hover:shadow-lg disabled:opacity-70"
            >
              {isSubmitting ? "Өңделуде..." : requiresTwoFactor ? "Кодпен кіру" : "Кіру"}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link href="/forgot-password" className="font-medium text-slate-600 hover:text-cyan-700">
              Құпиясөзді ұмыттым
            </Link>
            <p className="text-slate-600">
              Аккаунт жоқ па?{" "}
              <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                Тіркелу
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
