import { requirePatientPage } from "@/lib/session";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Баптау - DentFlow KZ",
};

export default async function SettingsPage() {
  const { user, patientProfile } = await requirePatientPage();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Баптау</h1>
        <p className="mt-1 text-sm text-slate-600">Сіздің профиліңіздің параметрлерін басқарыңыз</p>
      </div>

      {/* Профил ақпараты */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Профил ақпараты</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Аты-жөні</label>
            <div className="mt-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900">
              {user.name || "—"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Электрондық пошта</label>
            <div className="mt-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900">
              {user.email || "—"}
            </div>
          </div>

          {patientProfile?.birthDate && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Туған күні</label>
              <div className="mt-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900">
                {new Date(patientProfile.birthDate).toLocaleDateString("kk-KZ")}
              </div>
            </div>
          )}

          {patientProfile?.address && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Мекенжайы</label>
              <div className="mt-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900">
                {patientProfile.address}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Уведомление параметрлері */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Уведомление параметрлері</h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300 text-cyan-500"
            />
            <span className="text-sm font-medium text-slate-700">Сағындыру уведомлеңіз</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300 text-cyan-500"
            />
            <span className="text-sm font-medium text-slate-700">Емдеу туралы өзгертулер</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300 text-cyan-500"
            />
            <span className="text-sm font-medium text-slate-700">Іс пен сондағы ақпарат</span>
          </label>
        </div>
      </div>

      {/* Құпиялылық және қауіпсіздік */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Құпиялылық және қауіпсіздік</h2>
        
        <div className="space-y-3">
          <button className="w-full rounded-lg border border-slate-300 px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
            Құпия сөзді өзгерту
          </button>

          <button className="w-full rounded-lg border border-slate-300 px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
            Сеанстарды басқару
          </button>
        </div>
      </div>
    </div>
  );
}
