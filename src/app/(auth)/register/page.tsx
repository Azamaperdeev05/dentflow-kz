"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { DENTAL_SPECIALIZATIONS } from "@/lib/specializations";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "PATIENT",
      phone: "",
      specializations: [],
      licenseNumber: "",
    },
  });

  const role = watch("role");
  const selectedSpecializations = watch("specializations") || [];

  function togglePasswordVisibility() {
    setShowPasswords((prev) => !prev);
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setServerSuccess(null);

    const payload = {
      ...values,
      experience:
        values.role === "DOCTOR" && typeof values.experience === "number"
          ? values.experience
          : undefined,
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setServerError(result.error ?? "Тіркелу кезінде қате шықты");
      return;
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "register_pending_credentials",
        JSON.stringify({
          email: values.email,
          password: values.password,
        })
      );
    }

    setServerSuccess(result.message ?? "Тіркелу сәтті. Email-ге растау коды жіберілді.");
    router.push(`/register/verify?email=${encodeURIComponent(values.email)}`);
  });

  const roleCardBase =
    "relative flex cursor-pointer flex-col items-center rounded-2xl border p-4 text-center transition sm:p-5";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="mx-auto w-full max-w-2xl">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 lg:p-10">
          <div className="text-center lg:text-left">
            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl lg:mx-0">
              <Image src="/logo.png" alt="DentFlow KZ" width={60} height={60} className="object-contain" />
            </div>
            <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-900">Тіркелу</h2>
            <p className="mt-2 text-slate-600">DentFlow KZ жүйесіне тіркелу</p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
            <fieldset className="md:col-span-2">
              <span className="mb-3 block text-xl font-semibold text-slate-800">Сіз кімсіз?</span>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <label className={`${roleCardBase} ${role === "PATIENT" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                  <input type="radio" value="PATIENT" className="sr-only" {...register("role")} />
                  <span className="mb-2 text-3xl">👤</span>
                  <span className="text-2xl font-bold">Пациент</span>
                  <span className="mt-1 text-sm">Дәрігерге жазылу</span>
                  {role === "PATIENT" && <span className="mt-2 text-xl">✅</span>}
                </label>

                <label className={`${roleCardBase} ${role === "DOCTOR" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                  <input type="radio" value="DOCTOR" className="sr-only" {...register("role")} />
                  <span className="mb-2 text-3xl">🩺</span>
                  <span className="text-2xl font-bold">Дәрігер</span>
                  <span className="mt-1 text-sm">Клиника қызметкері</span>
                  {role === "DOCTOR" && <span className="mt-2 text-xl">✅</span>}
                </label>
              </div>
              {errors.role && <span className="mt-2 block text-sm text-red-600">{errors.role.message}</span>}
            </fieldset>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Аты-жөні *</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-blue-600">👤</span>
                <input
                  className="h-14 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  {...register("name")}
                />
              </div>
              {errors.name && <span className="mt-1 block text-sm text-red-600">{errors.name.message}</span>}
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Email *</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-blue-600">✉️</span>
                <input
                  type="email"
                  className="h-14 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  {...register("email")}
                />
              </div>
              {errors.email && <span className="mt-1 block text-sm text-red-600">{errors.email.message}</span>}
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Телефон</span>
              <input
                placeholder="+77001234567"
                className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                {...register("phone")}
              />
              {errors.phone && <span className="mt-1 block text-sm text-red-600">{errors.phone.message}</span>}
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Құпиясөз *</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-blue-600">🔒</span>
                <input
                  type={showPasswords ? "text" : "password"}
                  className="h-14 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-24 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  aria-label={showPasswords ? "Құпиясөзді жасыру" : "Құпиясөзді көрсету"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {showPasswords ? "Жасыру" : "Көрсету"}
                </button>
              </div>
              {errors.password && <span className="mt-1 block text-sm text-red-600">{errors.password.message}</span>}
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Құпиясөзді растау *</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-blue-600">🔒</span>
                <input
                  type={showPasswords ? "text" : "password"}
                  className="h-14 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-24 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  aria-label={showPasswords ? "Растауды жасыру" : "Растауды көрсету"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {showPasswords ? "Жасыру" : "Көрсету"}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="mt-1 block text-sm text-red-600">{errors.confirmPassword.message}</span>
              )}
            </label>

            {role === "DOCTOR" && (
              <>
                <fieldset className="md:col-span-2">
                  <span className="mb-3 block text-sm font-semibold text-slate-700">Мамандықтар *</span>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {DENTAL_SPECIALIZATIONS.map((spec) => (
                      <label key={spec} className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-3 cursor-pointer transition hover:bg-slate-50">
                        <input
                          type="checkbox"
                          value={spec}
                          {...register("specializations")}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-slate-700">{spec}</span>
                      </label>
                    ))}
                  </div>
                  {errors.specializations && (
                    <span className="mt-2 block text-sm text-red-600">{errors.specializations.message}</span>
                  )}
                </fieldset>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">Тәжірибе (жыл)</span>
                  <input
                    type="number"
                    min={0}
                    className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                    {...register("experience", { valueAsNumber: true })}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">Лицензия нөмірі</span>
                  <input
                    className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                    {...register("licenseNumber")}
                  />
                </label>
              </>
            )}

            {serverError && <p className="md:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>}
            {serverSuccess && <p className="md:col-span-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{serverSuccess}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="md:col-span-2 flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 font-semibold text-white transition hover:shadow-lg disabled:opacity-70"
            >
              {isSubmitting ? "Тіркелу..." : "Тіркелу"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-600">
            Аккаунтыңыз бар ма?{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Кіру
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
