"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      code: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const emailFromQuery = searchParams.get("email") ?? "";
    if (emailFromQuery) {
      setValue("email", emailFromQuery);
    }
  }, [searchParams, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setServerMessage(null);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const result = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setServerError(result.error ?? "Құпия сөзді жаңарту сәтсіз аяқталды");
      return;
    }

    setServerMessage(result.message ?? "Құпия сөз жаңартылды");
    router.push("/login");
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold text-slate-900">Құпия сөзді жаңарту</h1>
        <p className="mt-2 text-sm text-slate-600">Email, код және жаңа құпия сөзді енгізіңіз.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-cyan-500 focus:ring-2"
              {...register("email")}
            />
            {errors.email && <span className="mt-1 block text-sm text-red-600">{errors.email.message}</span>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">6 таңбалы код</span>
            <input
              inputMode="numeric"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-cyan-500 focus:ring-2"
              {...register("code")}
            />
            {errors.code && <span className="mt-1 block text-sm text-red-600">{errors.code.message}</span>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Жаңа құпия сөз</span>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-cyan-500 focus:ring-2"
              {...register("password")}
            />
            {errors.password && <span className="mt-1 block text-sm text-red-600">{errors.password.message}</span>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Құпия сөзді растау</span>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-cyan-500 focus:ring-2"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <span className="mt-1 block text-sm text-red-600">{errors.confirmPassword.message}</span>
            )}
          </label>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          {serverMessage && <p className="text-sm text-emerald-600">{serverMessage}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white transition hover:bg-cyan-700 disabled:opacity-70"
          >
            {isSubmitting ? "Сақталуда..." : "Құпия сөзді жаңарту"}
          </button>
        </form>

        <div className="mt-5 text-sm">
          <Link href="/login" className="text-cyan-700 hover:underline">
            Кіру бетіне оралу
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-12">
          <section className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h1 className="text-2xl font-semibold text-slate-900">Құпия сөзді жаңарту</h1>
            <p className="mt-2 text-sm text-slate-600">Жүктелуде...</p>
          </section>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
