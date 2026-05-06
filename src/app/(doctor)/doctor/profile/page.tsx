import Image from "next/image";
import { DoctorNav } from "@/components/doctor/doctor-nav";
import { DoctorSignOutButton } from "@/components/doctor/doctor-signout-button";
import { DoctorProfileEditor } from "@/components/doctor/doctor-profile-editor";
import { TwoFactorSettings } from "@/components/shared/two-factor-settings";
import { requireDoctorPage } from "@/lib/session";
import { parseWorkDays } from "@/lib/scheduling";

export const metadata = {
  title: "Дәрігер профилі - DentFlow KZ",
};

export default async function DoctorProfilePage() {
  const { user, doctorProfile } = await requireDoctorPage();
  const specializations = (() => {
    try {
      const parsed = JSON.parse(doctorProfile.specializations || "[]") as string[];
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  })();

  const workDays = parseWorkDays(doctorProfile.workDays);

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

        <DoctorProfileEditor
          initialValues={{
            phone: user.phone || "",
            specializations,
            experience: doctorProfile.experience,
            rating: doctorProfile.rating,
            reviewCount: doctorProfile.reviewCount,
            licenseNumber: doctorProfile.licenseNumber || "",
            education: doctorProfile.education || "",
            about: doctorProfile.about || "",
            isAvailable: doctorProfile.isAvailable,
            workDays,
            workHoursStart: doctorProfile.workHoursStart,
            workHoursEnd: doctorProfile.workHoursEnd,
            slotDuration: doctorProfile.slotDuration,
          }}
        />

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
