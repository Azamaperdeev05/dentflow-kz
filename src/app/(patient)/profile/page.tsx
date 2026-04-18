import Image from "next/image";
import { requirePatientPage } from "@/lib/session";
import { TwoFactorSettings } from "@/components/shared/two-factor-settings";

export const metadata = {
  title: "Профиль - DentFlow KZ",
};

function formatDate(value?: Date | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("kk-KZ");
}

export default async function PatientProfilePage() {
  const { user, patientProfile } = await requirePatientPage();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900">
          <Image src="/icons/windows11-outline/profile.png" alt="" width={32} height={32} />
          Профиль
        </h1>
        <p className="mt-1 text-sm text-slate-600">Жеке мәліметтеріңіз және медициналық ақпаратыңыз</p>
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Телефон</p>
          <p className="mt-2 text-lg font-bold text-slate-900">{user.phone || "—"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Аккаунт статусы</p>
          <p className="mt-2 text-lg font-bold text-slate-900">{user.isVerified ? "Расталған" : "Расталмаған"}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Медициналық профиль</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-slate-500">Туған күні</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{formatDate(patientProfile?.birthDate)}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Жынысы</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{patientProfile?.gender || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Қан тобы</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{patientProfile?.bloodType || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Аллергия</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{patientProfile?.allergies || "—"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Қосымша ақпарат</h2>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">Мекенжай</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{patientProfile?.address || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Ескертпе</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{patientProfile?.notes || "—"}</p>
          </div>
        </div>
      </section>

      <TwoFactorSettings initialEnabled={user.twoFactorEnabled} />
    </div>
  );
}
