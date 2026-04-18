import { prisma } from "@/lib/db";
import Image from "next/image";
import { requireDoctorPage } from "@/lib/session";
import { DoctorNav } from "@/components/doctor/doctor-nav";
import { CreatePaymentForm } from "@/components/doctor/create-payment-form";
import { getPaymentMethodLabel } from "@/lib/kz-labels";

type Props = {
  searchParams: {
    from?: string;
    to?: string;
  };
};

export default async function DoctorFinancePage({ searchParams }: Props) {
  const { doctorProfile } = await requireDoctorPage();

  const from = searchParams.from ? new Date(searchParams.from) : null;
  const to = searchParams.to ? new Date(searchParams.to) : null;
  if (to) {
    to.setHours(23, 59, 59, 999);
  }

  const payments = await prisma.payment.findMany({
    where: {
      treatment: {
        appointment: {
          doctorId: doctorProfile.id,
        },
      },
      ...(from || to
        ? {
            paidAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    include: {
      treatment: {
        include: {
          patient: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  const treatments = await prisma.treatment.findMany({
    where: {
      appointment: {
        doctorId: doctorProfile.id,
      },
    },
    include: {
      patient: { include: { user: { select: { name: true } } } },
    },
    orderBy: { startDate: "desc" },
  });

  const totalIncome = payments.reduce((sum, item) => sum + item.amount, 0);
  const debt = treatments.reduce((sum, item) => sum + Math.max(item.totalCost - item.paidAmount, 0), 0);
  const netBalance = totalIncome - debt;
  const byMethod = payments.reduce<Record<string, number>>((acc, item) => {
    acc[item.method] = (acc[item.method] ?? 0) + item.amount;
    return acc;
  }, {});
  const cashByDay = payments
    .filter((item) => item.method === "CASH")
    .reduce<Record<string, number>>((acc, item) => {
      const key = new Date(item.paidAt).toLocaleDateString("kk-KZ");
      acc[key] = (acc[key] ?? 0) + item.amount;
      return acc;
    }, {});

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row">
      <DoctorNav />

      <section className="min-w-0 flex-1 space-y-6">
        <header className="space-y-4">
          <h1 className="flex items-center gap-3 text-4xl font-bold text-slate-900">
            <Image src="/icons/windows11-filled/finance.png" alt="" width={36} height={36} />
            Қаржы аппараты
          </h1>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 ring-1 ring-emerald-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Жалпы төлем</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{totalIncome.toLocaleString("kk-KZ")} ₸</p>
              </div>
              <Image src="/icons/windows11-filled/dashboard.png" alt="" width={32} height={32} className="opacity-90" />
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 p-6 ring-1 ring-amber-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Қарыз қалдығы</p>
                <p className="mt-2 text-3xl font-bold text-amber-900">{debt.toLocaleString("kk-KZ")} ₸</p>
              </div>
              <Image src="/icons/windows11-filled/medical-history.png" alt="" width={32} height={32} className="opacity-90" />
            </div>
          </div>

          <form method="GET" className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-900"><Image src="/icons/windows11-outline/calendar.png" alt="" width={16} height={16} />Күн бойынша сүзгі</p>
            <div className="mt-3 flex gap-2">
              <input type="date" name="from" defaultValue={searchParams.from} className="flex-1 rounded-lg border border-slate-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              <input type="date" name="to" defaultValue={searchParams.to} className="flex-1 rounded-lg border border-slate-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              <button type="submit" className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition whitespace-nowrap">
                OK
              </button>
            </div>
          </form>

          <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 ring-1 ring-cyan-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700">Есеп-қисап балансы</p>
                <p className={`mt-2 text-3xl font-bold ${netBalance >= 0 ? "text-cyan-900" : "text-red-700"}`}>
                  {netBalance.toLocaleString("kk-KZ")} ₸
                </p>
              </div>
              <Image src="/icons/windows11-filled/finance.png" alt="" width={32} height={32} className="opacity-90" />
            </div>
          </div>
        </section>

        <CreatePaymentForm
          treatments={treatments.map((item) => ({
            id: item.id,
            title: `${item.patient.user.name} - ${item.diagnosis}`,
            totalCost: item.totalCost,
            paidAmount: item.paidAmount,
          }))}
        />

        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Image src="/icons/windows11-outline/dashboard.png" alt="" width={22} height={22} />
            Төлемдер тарихы
          </h2>
          {payments.length === 0 ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-6 text-center border border-slate-200">
              <p className="text-slate-600">😔 Төлемдер жоқ</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-700 font-semibold">
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/calendar.png" alt="" width={15} height={15} />Күні</span></th>
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/patients.png" alt="" width={15} height={15} />Пациент</span></th>
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/finance.png" alt="" width={15} height={15} />Сома</span></th>
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/doctor.png" alt="" width={15} height={15} />Әдіс</span></th>
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/messages.png" alt="" width={15} height={15} />Ескерту</span></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}>
                      <td className="py-3 px-4 font-medium text-slate-900">{new Date(item.paidAt).toLocaleString("kk-KZ")}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.treatment.patient.user.name}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">{item.amount.toLocaleString("kk-KZ")} ₸</td>
                      <td className="py-3 px-4 text-slate-700">{getPaymentMethodLabel(item.method)}</td>
                      <td className="py-3 px-4 text-slate-700">{item.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">Есеп-қисап (әдіс бойынша)</h3>
            {Object.keys(byMethod).length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Төлем жазбасы жоқ</p>
            ) : (
              <div className="mt-3 space-y-2">
                {Object.entries(byMethod).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-700">{getPaymentMethodLabel(method)}</span>
                    <span className="font-semibold text-slate-900">{amount.toLocaleString("kk-KZ")} ₸</span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">Касса есебі (күндік)</h3>
            {Object.keys(cashByDay).length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Касса төлемдері жоқ</p>
            ) : (
              <div className="mt-3 space-y-2">
                {Object.entries(cashByDay).map(([day, amount]) => (
                  <div key={day} className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                    <span className="font-medium text-emerald-800">{day}</span>
                    <span className="font-semibold text-emerald-900">{amount.toLocaleString("kk-KZ")} ₸</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </section>
    </main>
  );
}
