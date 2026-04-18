import Image from "next/image";
import { DoctorNav } from "@/components/doctor/doctor-nav";
import { DoctorSignOutButton } from "@/components/doctor/doctor-signout-button";
import { TwoFactorSettings } from "@/components/shared/two-factor-settings";
import { requireDoctorPage } from "@/lib/session";

export const metadata = {
  title: "Дәрігер профилі - DentFlow KZ",
};

const dayLabels: Record<string, string> = {
  "0": "Жексенбі",
  "1": "Дүйсенбі",
  "2": "Сейсенбі",
  "3": "Сәрсенбі",
  "4": "Бейсенбі",
  "5": "Жұма",
  "6": "Сенбі",
};

function formatWorkDays(value: string) {
  try {
    const parsed = JSON.parse(value) as Array<number | string>;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return "Көрсетілмеген";
    }

    const result = parsed
      .map((item) => dayLabels[String(item)])
      .filter(Boolean);

    return result.length > 0 ? result.join(", ") : "Көрсетілмеген";
  } catch {
    return "Көрсетілмеген";
  }
}

export default async function DoctorProfilePage() {
  const { user, doctorProfile } = await requireDoctorPage();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row">
      <DoctorNav />

      <section className="min-w-0 flex-1 space-y-6">
        <header>
          <h1 className="flex items-center gap-3 text-4xl font-bold text-slate-900">
            <Image src="/icons/windows11-outline/profile.png" alt="" width={36} height={36} />
            Профиль
          </h1>
          <p className="mt-1 text-sm text-slate-600">Жеке және кәсіби мәліметтер</p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Аты-жөні</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{user.name}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</p>
            <p className="mt-2 text-lg font-bold text-slate-900 break-all">{user.email}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Мамандықтар</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(() => {
                try {
                  const specs = JSON.parse(doctorProfile.specializations || "[]");
                  return (specs as string[]).map((spec, i) => (
                    <span key={i} className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                      {spec}
                    </span>
                  ));
                } catch {
                  return <span className="text-slate-500">—</span>;
                }
              })()}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Тәжірибе</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{doctorProfile.experience} жыл</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Кәсіби ақпарат</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-slate-500">Лицензия нөмірі</p>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{doctorProfile.licenseNumber || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Білімі</p>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{doctorProfile.education || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Рейтинг</p>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{doctorProfile.rating.toFixed(1)} / 5 ({doctorProfile.reviewCount} пікір)</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Статус</p>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{doctorProfile.isAvailable ? "Қабылдауда" : "Қолжетімсіз"}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-500">Өзі туралы</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{doctorProfile.about || "—"}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Жұмыс кестесі</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-slate-500">Жұмыс күндері</p>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{formatWorkDays(doctorProfile.workDays)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Жұмыс уақыты</p>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                {doctorProfile.workHoursStart} - {doctorProfile.workHoursEnd}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Бір қабылдау ұзақтығы</p>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{doctorProfile.slotDuration} минут</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Телефон</p>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{user.phone || "—"}</p>
            </div>
          </div>
        </section>

        <TwoFactorSettings initialEnabled={user.twoFactorEnabled} />

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Аккаунт</h2>
          <p className="mt-1 text-sm text-slate-600">Сессияны аяқтау үшін батырманы басыңыз.</p>
          <div className="mt-4">
            <DoctorSignOutButton />
          </div>
        </section>
      </section>
    </main>
  );
}
