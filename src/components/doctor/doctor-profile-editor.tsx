"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WeekdayCode } from "@/lib/scheduling";
import { uiFeedback } from "@/lib/ui-feedback";

const weekDays: Array<{ code: WeekdayCode; label: string }> = [
  { code: "MON", label: "Дүйсенбі" },
  { code: "TUE", label: "Сейсенбі" },
  { code: "WED", label: "Сәрсенбі" },
  { code: "THU", label: "Бейсенбі" },
  { code: "FRI", label: "Жұма" },
  { code: "SAT", label: "Сенбі" },
  { code: "SUN", label: "Жексенбі" },
];

type Props = {
  initialValues: {
    phone: string;
    specializations: string[];
    experience: number;
    rating: number;
    reviewCount: number;
    licenseNumber: string;
    education: string;
    about: string;
    isAvailable: boolean;
    workDays: WeekdayCode[];
    workHoursStart: string;
    workHoursEnd: string;
    slotDuration: number;
  };
};

export function DoctorProfileEditor({ initialValues }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(initialValues.phone);
  const [specializations, setSpecializations] = useState(initialValues.specializations.join(", "));
  const [experience, setExperience] = useState(String(initialValues.experience));
  const [licenseNumber, setLicenseNumber] = useState(initialValues.licenseNumber);
  const [education, setEducation] = useState(initialValues.education);
  const [about, setAbout] = useState(initialValues.about);
  const [isAvailable, setIsAvailable] = useState(initialValues.isAvailable);
  const [workDays, setWorkDays] = useState<WeekdayCode[]>(initialValues.workDays);
  const [workHoursStart, setWorkHoursStart] = useState(initialValues.workHoursStart);
  const [workHoursEnd, setWorkHoursEnd] = useState(initialValues.workHoursEnd);
  const [slotDuration, setSlotDuration] = useState(String(initialValues.slotDuration));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedDays = useMemo(() => weekDays.filter((day) => workDays.includes(day.code)), [workDays]);

  function toggleWorkDay(code: WeekdayCode) {
    setWorkDays((current) => (current.includes(code) ? current.filter((item) => item !== code) : [...current, code]));
  }

  async function submit() {
    setLoading(true);
    setMessage(null);

    const parsedSpecializations = specializations
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      phone: phone.trim() || null,
      specializations: parsedSpecializations,
      experience: Number(experience) || 0,
      licenseNumber: licenseNumber.trim() || null,
      education: education.trim() || null,
      about: about.trim() || null,
      isAvailable,
      workDays,
      workHoursStart,
      workHoursEnd,
      slotDuration: Number(slotDuration) || 30,
    };

    try {
      const response = await fetch("/api/doctor/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(data.error ?? uiFeedback.genericError);
        return;
      }

      setMessage("Кәсіби ақпарат сақталды.");
      setIsEditing(false);
      router.refresh();
    } catch {
      setMessage(uiFeedback.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Кәсіби ақпарат</h2>
          <p className="mt-1 text-sm text-slate-600">Мамандық, жұмыс кестесі және байланыс деректері осында басқарылады.</p>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing((current) => !current)}
          className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100 transition"
        >
          {isEditing ? "Жабу" : "Өзгерту"}
        </button>
      </div>

      {!isEditing ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-slate-500">Лицензия нөмірі</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{licenseNumber || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Білімі</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{education || "—"}</p>
          </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Рейтинг</p>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                {initialValues.rating.toFixed(1)} / 5 ({initialValues.reviewCount} пікір)
              </p>
            </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Статус</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{isAvailable ? "Қабылдауда" : "Қолжетімсіз"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-slate-500">Мамандықтар</p>
            <div className="mt-1 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {specializations.split(/[,\n]/).map((item) => item.trim()).filter(Boolean).length > 0 ? specializations.split(/[,\n]/).map((item) => item.trim()).filter(Boolean).map((item) => (
                <span key={item} className="rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">{item}</span>
              )) : <span className="text-sm text-slate-500">—</span>}
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-slate-500">Өзі туралы</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{about || "—"}</p>
          </div>
          <div className="md:col-span-2 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Жұмыс күндері</p>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                {workDays.length > 0 ? selectedDays.map((day) => day.label).join(", ") : "Көрсетілмеген"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Жұмыс уақыты</p>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{workHoursStart} - {workHoursEnd}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Бір қабылдау ұзақтығы</p>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{slotDuration} минут</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Телефон</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{phone || "—"}</p>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Телефон</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="+770..." />
            </label>

            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Тәжірибе</span>
              <input type="number" min={0} max={80} value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>

            <label className="text-sm text-slate-700 md:col-span-2">
              <span className="mb-1 block font-medium">Мамандықтар</span>
              <textarea
                value={specializations}
                onChange={(e) => setSpecializations(e.target.value)}
                rows={3}
                placeholder="Жалпы стоматология, хирургия"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Лицензия нөмірі</span>
              <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>

            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Статус</span>
              <label className="flex items-center gap-3 rounded-lg border border-slate-300 px-3 py-2">
                <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                <span>{isAvailable ? "Қабылдауда" : "Қолжетімсіз"}</span>
              </label>
            </label>

            <label className="text-sm text-slate-700 md:col-span-2">
              <span className="mb-1 block font-medium">Білімі</span>
              <textarea value={education} onChange={(e) => setEducation(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>

            <label className="text-sm text-slate-700 md:col-span-2">
              <span className="mb-1 block font-medium">Өзі туралы</span>
              <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Жұмыс күндері</p>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {weekDays.map((day) => (
                <label key={day.code} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <input type="checkbox" checked={workDays.includes(day.code)} onChange={() => toggleWorkDay(day.code)} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                  <span>{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Жұмыс басталуы</span>
              <input type="time" value={workHoursStart} onChange={(e) => setWorkHoursStart(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Жұмыс аяқталуы</span>
              <input type="time" value={workHoursEnd} onChange={(e) => setWorkHoursEnd(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Бір қабылдау ұзақтығы</span>
              <input type="number" min={10} max={180} value={slotDuration} onChange={(e) => setSlotDuration(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
              Бас тарту
            </button>
            <button type="button" onClick={submit} disabled={loading} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-70">
              {loading ? "Сақталуда..." : "Сақтау"}
            </button>
          </div>
        </div>
      )}

      {message && <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</p>}
    </section>
  );
}