"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { allergyOptions, bloodTypeOptions, genderOptions, kazakhstanRegions, parseStringArray } from "@/lib/patient-profile-options";
import { uiFeedback } from "@/lib/ui-feedback";

type Props = {
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

export function PatientProfileForm({ patientProfile }: Props) {
  const router = useRouter();
  const [birthDate, setBirthDate] = useState(patientProfile.birthDate ? new Date(patientProfile.birthDate).toISOString().slice(0, 10) : "");
  const [gender, setGender] = useState(patientProfile.gender ?? "");
  const [region, setRegion] = useState(patientProfile.region ?? "");
  const [address, setAddress] = useState(patientProfile.address ?? "");
  const [bloodType, setBloodType] = useState(patientProfile.bloodType ?? "");
  const [allergies, setAllergies] = useState<string[]>(parseStringArray(patientProfile.allergies));
  const [notes, setNotes] = useState(patientProfile.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const allergyCount = useMemo(() => allergies.length, [allergies]);

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

      setMessage("Профиль сақталды.");
      router.refresh();
    } catch {
      setMessage(uiFeedback.networkError);
    } finally {
      setLoading(false);
    }
  }

  function toggleAllergy(option: string) {
    setAllergies((prev) => (prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Медициналық профиль және қосымша ақпарат</h2>
          <p className="mt-1 text-sm text-slate-600">Бұл мәліметтер сіздің профиліңізге сақталады және дәрігерлерге көрінеді.</p>
        </div>
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">Аллергия: {allergyCount}</span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Туған күні</span>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Жынысы</span>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Таңдау</option>
            {genderOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Қан тобы</span>
          <select value={bloodType} onChange={(e) => setBloodType(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Таңдау</option>
            {bloodTypeOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Мекенжай / облыс</span>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Облысты таңдаңыз</option>
            {kazakhstanRegions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700 md:col-span-2">
          <span className="mb-1 block font-medium">Толық мекенжай</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Көше, үй, пәтер" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>

        <div className="md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-700">Аллергия түрлері</span>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {allergyOptions.map((item) => (
              <label key={item} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input type="checkbox" checked={allergies.includes(item)} onChange={() => toggleAllergy(item)} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="text-sm text-slate-700 md:col-span-2">
          <span className="mb-1 block font-medium">Қосымша ескертпе</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Кез келген маңызды медициналық ақпарат" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
      </div>

      {message && <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</p>}

      <div className="mt-4 flex justify-end">
        <button type="button" onClick={submit} disabled={loading} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-70">
          {loading ? "Сақталуда..." : "Сақтау"}
        </button>
      </div>
    </section>
  );
}
