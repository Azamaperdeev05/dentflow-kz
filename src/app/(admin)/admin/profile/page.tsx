import { DoctorSignOutButton } from "@/components/doctor/doctor-signout-button";
import { TwoFactorSettings } from "@/components/shared/two-factor-settings";
import { requireAdminPage } from "@/lib/session";

export const metadata = {
  title: "Admin профилі - DentFlow KZ",
};

type Props = {
  searchParams?: {
    setup2fa?: string;
  };
};

export default async function AdminProfilePage({ searchParams }: Props) {
  const { user } = await requireAdminPage({ requireTwoFactor: false });
  const needSetup = searchParams?.setup2fa === "1";

  return (
    <main className="space-y-6 py-4">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Админ профилі</h1>
        <p className="mt-1 text-sm text-slate-600">Қауіпсіздік панеліне кіру үшін admin аккаунтта 2FA қосулы болуы керек.</p>
      </header>

      {needSetup && !user.twoFactorEnabled && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
          Security панеліне өту үшін алдымен осы беттен Google Authenticator 2FA қосыңыз.
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Аты-жөні</p>
          <p className="mt-2 text-lg font-bold text-slate-900">{user.name}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</p>
          <p className="mt-2 text-lg font-bold text-slate-900 break-all">{user.email}</p>
        </article>
      </section>

      <TwoFactorSettings initialEnabled={user.twoFactorEnabled} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Аккаунт</h2>
        <p className="mt-1 text-sm text-slate-600">Сессияны аяқтау үшін батырманы басыңыз.</p>
        <div className="mt-4">
          <DoctorSignOutButton />
        </div>
      </section>
    </main>
  );
}
