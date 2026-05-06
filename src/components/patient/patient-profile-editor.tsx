"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  allergyOptions,
  bloodTypeOptions,
  genderOptions,
  kazakhstanRegions,
  parseStringArray,
} from "@/lib/patient-profile-options";
import { uiFeedback } from "@/lib/ui-feedback";

type Props = {
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
  patientProfile: {
    birthDate?: string | Date | null;
    gender?: string | null;
    region?: string | null;
    address?: string | null;
    bloodType?: string | null;
    allergies?: string | null;
    notes?: string | null;
  };
};

function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("kk-KZ");
}

function formatGender(value?: string | null) {
  if (value === "MALE") return "Ұл";
  if (value === "FEMALE") return "Қыз";
  return "—";
}

export function PatientProfileEditor({ user, patientProfile }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [birthDate, setBirthDate] = useState(
    patientProfile.birthDate
      ? new Date(patientProfile.birthDate).toISOString().slice(0, 10)
      : ""
  );
  const [gender, setGender] = useState(patientProfile.gender ?? "");
  const [region, setRegion] = useState(patientProfile.region ?? "");
  const [address, setAddress] = useState(patientProfile.address ?? "");
  const [bloodType, setBloodType] = useState(patientProfile.bloodType ?? "");
  const [allergies, setAllergies] = useState<string[]>(
    parseStringArray(patientProfile.allergies)
  );
  const [notes, setNotes] = useState(patientProfile.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const allergyCount = useMemo(() => allergies.length, [allergies]);

  function toggleAllergy(option: string) {
    setAllergies((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  }

  function cancelEditing() {
    setBirthDate(
      patientProfile.birthDate
        ? new Date(patientProfile.birthDate).toISOString().slice(0, 10)
        : ""
    );
    setGender(patientProfile.gender ?? "");
    setRegion(patientProfile.region ?? "");
    setAddress(patientProfile.address ?? "");
    setBloodType(patientProfile.bloodType ?? "");
    setAllergies(parseStringArray(patientProfile.allergies));
    setNotes(patientProfile.notes ?? "");
    setMessage(null);
    setIsEditing(false);
  }

  async function submit() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/patient/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate: birthDate || null,
          gender: gender || null,
          region: region || null,
          address: address || null,
          bloodType: bloodType || null,
          allergies,
          notes: notes || null,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(data.error ?? uiFeedback.genericError);
        return;
      }

      setMessage("✅ Профиль сәтті сақталды!");
      setIsEditing(false);
      router.refresh();
    } catch {
      setMessage(uiFeedback.networkError);
    } finally {
      setLoading(false);
    }
  }

  // ----- Read-only view -----
  const readOnlyView = (
    <>
      {/* Медициналық профиль */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/icons/windows11-filled/medical-history.png" alt="" width={24} height={24} />
            <h2 className="text-xl font-bold text-slate-900">Медициналық профиль</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-slate-500">Облыс</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
              {region || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Туған күні</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
              {formatDate(birthDate || null)}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Жынысы</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
              {formatGender(gender || null)}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Қан тобы</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
              {bloodType || "—"}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-slate-500">Аллергия</p>
            <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
              {allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Қосымша ақпарат */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Image src="/icons/windows11-filled/messages.png" alt="" width={24} height={24} />
          <h2 className="text-xl font-bold text-slate-900">Қосымша ақпарат</h2>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">Мекенжай</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
              {address || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Ескертпе</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
              {notes || "—"}
            </p>
          </div>
        </div>
      </section>
    </>
  );

  // ----- Editable form view -----
  const editableView = (
    <section className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-white to-cyan-50/30 p-6 shadow-sm ring-1 ring-cyan-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Медициналық профиль және қосымша ақпарат</h2>
          <p className="mt-1 text-sm text-slate-600">
            Бұл мәліметтер сіздің профиліңізге сақталады және дәрігерлерге көрінеді.
          </p>
        </div>
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-200">
          Аллергия: {allergyCount}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Облыс</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          >
            <option value="">Облысты таңдаңыз</option>
            {kazakhstanRegions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Туған күні</span>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Жынысы</span>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          >
            <option value="">Таңдау</option>
            {genderOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Қан тобы</span>
          <select
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          >
            <option value="">Таңдау</option>
            {bloodTypeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-700">Аллергия түрлері</span>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {allergyOptions.map((item) => (
              <label
                key={item}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                  allergies.includes(item)
                    ? "border-cyan-300 bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={allergies.includes(item)}
                  onChange={() => toggleAllergy(item)}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="text-sm text-slate-700 md:col-span-2">
          <span className="mb-1 block font-medium">Толық мекенжай</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Көше, үй, пәтер"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </label>

        <label className="text-sm text-slate-700 md:col-span-2">
          <span className="mb-1 block font-medium">Қосымша ескертпе</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Кез келген маңызды медициналық ақпарат"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={cancelEditing}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          Бас тарту
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-70 transition"
        >
          {loading ? "Сақталуда..." : "💾 Сақтау"}
        </button>
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      {/* Header with edit toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900">
            <Image src="/icons/windows11-outline/profile.png" alt="" width={32} height={32} />
            Профиль
          </h1>
          <p className="mt-1 text-sm text-slate-600">Жеке мәліметтеріңіз және медициналық ақпаратыңыз</p>
        </div>
        <button
          type="button"
          onClick={() => (isEditing ? cancelEditing() : setIsEditing(true))}
          className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
            isEditing
              ? "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
              : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
          }`}
        >
          {isEditing ? "✕ Жабу" : "✏️ Өзгерту"}
        </button>
      </div>

      {/* User cards — always visible */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100 p-5 ring-1 ring-cyan-200 shadow-sm hover:shadow-md transition">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Аты-жөні</p>
          <p className="mt-2 text-lg font-bold text-cyan-900">{user.name}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-5 ring-1 ring-blue-200 shadow-sm hover:shadow-md transition">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Email</p>
          <p className="mt-2 text-lg font-bold text-blue-900 break-all">{user.email}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-5 ring-1 ring-purple-200 shadow-sm hover:shadow-md transition">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-600">Телефон</p>
          <p className="mt-2 text-lg font-bold text-purple-900">{user.phone || "—"}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 ring-1 ring-emerald-200 shadow-sm hover:shadow-md transition">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Аккаунт</p>
          <p className="mt-2 text-lg font-bold text-emerald-900">Расталған ✓</p>
        </div>
      </section>

      {/* Feedback message */}
      {message && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.startsWith("✅")
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
          }`}
        >
          {message}
        </p>
      )}

      {/* Toggle: read-only or editable */}
      {isEditing ? editableView : readOnlyView}
    </div>
  );
}
