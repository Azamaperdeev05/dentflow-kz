import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/session";

type Props = {
  searchParams?: {
    from?: string;
    to?: string;
    action?: string;
    status?: string;
    userId?: string;
    suspicious?: string;
    page?: string;
  };
};

function parseDate(value?: string, endOfDay = false) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

export const metadata = {
  title: "Admin Security - DentFlow KZ",
};

export default async function AdminSecurityPage({ searchParams }: Props) {
  const { user } = await requireAdminPage();

  const from = parseDate(searchParams?.from);
  const to = parseDate(searchParams?.to, true);
  const suspicious = searchParams?.suspicious === "1";
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const pageSize = 30;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
    ...(searchParams?.action ? { action: searchParams.action } : {}),
    ...(searchParams?.status ? { status: searchParams.status } : {}),
    ...(searchParams?.userId ? { userId: searchParams.userId } : {}),
    ...(searchParams?.suspicious === "1" ? { isSuspicious: true } : {}),
  };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalCount, logs, suspiciousCount, deniedCount, todayCount, topActions, users, riskySignals, allActions] = await Promise.all([
    prisma.securityAuditLog.count({ where }),
    prisma.securityAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
    prisma.securityAuditLog.count({ where: { isSuspicious: true } }),
    prisma.securityAuditLog.count({ where: { status: "DENIED" } }),
    prisma.securityAuditLog.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.securityAuditLog.groupBy({
      by: ["action"],
      _count: { _all: true },
      orderBy: { _count: { action: "desc" } },
      take: 5,
    }),
    prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.loginRiskSignal.findMany({
      where: { isSuspicious: true },
      orderBy: [{ riskScore: "desc" }, { updatedAt: "desc" }],
      take: 10,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
    prisma.securityAuditLog.groupBy({
      by: ["action"],
      orderBy: { action: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <main className="space-y-6 py-4">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Қауіпсіздік оқиғалары журналы</h1>
        <p className="text-sm text-slate-600">
          Кім, қашан, қандай әрекет жасағанын бақылау: кіру, шығу, пароль, дерекке қолжетімділік, рұқсаттан бас тарту.
        </p>
        <p className="text-xs text-slate-500">Қазіргі админ: {user.name}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Бүгінгі оқиғалар</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{todayCount}</p>
        </article>
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <p className="text-sm text-rose-700">Рұқсаттан бас тарту</p>
          <p className="mt-2 text-3xl font-bold text-rose-800">{deniedCount}</p>
        </article>
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm text-amber-700">Күдікті оқиғалар</p>
          <p className="mt-2 text-3xl font-bold text-amber-800">{suspiciousCount}</p>
        </article>
        <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm text-blue-700">Фильтр бойынша</p>
          <p className="mt-2 text-3xl font-bold text-blue-800">{totalCount}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Фильтр</h2>
        <form method="GET" className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="text-sm text-slate-600">
            Басталу күні
            <input name="from" defaultValue={searchParams?.from ?? ""} type="date" className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="text-sm text-slate-600">
            Аяқталу күні
            <input name="to" defaultValue={searchParams?.to ?? ""} type="date" className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="text-sm text-slate-600">
            Әрекет
            <select name="action" defaultValue={searchParams?.action ?? ""} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3">
              <option value="">Барлығы</option>
              {allActions.map((item) => (
                <option key={item.action} value={item.action}>{item.action}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600">
            Статус
            <select name="status" defaultValue={searchParams?.status ?? ""} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3">
              <option value="">Барлығы</option>
              <option value="SUCCESS">Сәтті</option>
              <option value="FAILED">Сәтсіз</option>
              <option value="DENIED">Рұқсаттан бас</option>
            </select>
          </label>
          <label className="text-sm text-slate-600">
            Админ қолданушысы
            <select name="userId" defaultValue={searchParams?.userId ?? ""} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3">
              <option value="">Барлығы</option>
              {users.map((admin) => (
                <option key={admin.id} value={admin.id}>{admin.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600">
            Күдікті
            <select name="suspicious" defaultValue={searchParams?.suspicious ?? ""} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3">
              <option value="">Барлығы</option>
              <option value="1">Тек күдікті</option>
            </select>
          </label>
          <div className="md:col-span-2 xl:col-span-6 flex gap-2">
            <button type="submit" className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-sm font-semibold text-white">
              Қолдану
            </button>
            <Link href="/admin/security" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Орнына келтіру
            </Link>
          </div>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Топ 5 әрекет</h2>
          <div className="mt-3 space-y-2">
            {topActions.length === 0 ? (
              <p className="text-sm text-slate-500">Дерек жоқ</p>
            ) : (
              topActions.map((item) => (
                <div key={item.action} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-700">{item.action}</span>
                  <span className="font-semibold text-slate-900">{item._count._all}</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Күдікті тәуекел сигналдары</h2>
          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
            {riskySignals.length === 0 ? (
              <p className="text-sm text-slate-500">Күдікті сигнал табылмады</p>
            ) : (
              riskySignals.map((signal) => (
                <div key={signal.id} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                  <p className="font-semibold text-amber-900">{signal.user?.name ?? signal.email ?? "Белгісіз"}</p>
                  <p className="text-amber-800">Risk: {signal.riskScore} | Failed: {signal.failedAttempts}</p>
                  <p className="text-amber-700 text-xs break-all">IP: {signal.ipAddress}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Оқиғалар тізімі</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="px-3 py-2 font-semibold">Уақыты</th>
                <th className="px-3 py-2 font-semibold">Қолданушы</th>
                <th className="px-3 py-2 font-semibold">Әрекет</th>
                <th className="px-3 py-2 font-semibold">Ресурс</th>
                <th className="px-3 py-2 font-semibold">Статус</th>
                <th className="px-3 py-2 font-semibold">Тәуекел</th>
                <th className="px-3 py-2 font-semibold">IP адресі</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 text-slate-700">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(log.createdAt).toLocaleString("kk-KZ")}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium">{log.user?.name ?? "—"}</p>
                    <p className="text-xs text-slate-500">{log.user?.email ?? "Белгісіз"}</p>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-semibold">{log.action}</p>
                    <p className="text-xs text-slate-500">{log.eventType}</p>
                  </td>
                  <td className="px-3 py-2">{log.resource}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      log.status === "SUCCESS"
                        ? "bg-emerald-100 text-emerald-700"
                        : log.status === "DENIED"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {log.status === "SUCCESS" ? "✅ Сәтті" : log.status === "DENIED" ? "❌ Рұқсаттан бас" : "⚠️ Қате"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      log.riskScore >= 60 ? "bg-red-100 text-red-700" :
                      log.riskScore >= 30 ? "bg-orange-100 text-orange-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>
                      {log.riskScore}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{log.ipAddress && log.ipAddress !== "unknown" ? log.ipAddress : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-slate-600">Бет: {page} / {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/security?${new URLSearchParams({
                  from: searchParams?.from ?? "",
                  to: searchParams?.to ?? "",
                  action: searchParams?.action ?? "",
                  status: searchParams?.status ?? "",
                  userId: searchParams?.userId ?? "",
                  suspicious: searchParams?.suspicious ?? "",
                  page: String(page - 1),
                }).toString()}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700"
              >
                ← Алдыңғы
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/security?${new URLSearchParams({
                  from: searchParams?.from ?? "",
                  to: searchParams?.to ?? "",
                  action: searchParams?.action ?? "",
                  status: searchParams?.status ?? "",
                  userId: searchParams?.userId ?? "",
                  suspicious: searchParams?.suspicious ?? "",
                  page: String(page + 1),
                }).toString()}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700"
              >
                Келесі →
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
