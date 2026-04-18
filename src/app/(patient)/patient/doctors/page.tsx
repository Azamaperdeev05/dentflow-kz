import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePatientPage } from "@/lib/session";

type Props = {
  searchParams: {
    q?: string;
    specialization?: string;
    available?: string;
  };
};

export default async function DoctorsPage({ searchParams }: Props) {
  await requirePatientPage();

  const q = searchParams.q?.trim() ?? "";
  const specialization = searchParams.specialization?.trim() ?? "";
  const availableOnly = searchParams.available === "1";

  const doctors = await prisma.doctorProfile.findMany({
    where: {
      ...(specialization ? { specializations: { contains: specialization } } : {}),
      ...(availableOnly ? { isAvailable: true } : {}),
      ...(q
        ? {
            OR: [
              { specializations: { contains: q } },
              { user: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    take: 50,
  });

  return (
    <main className="flex min-h-[calc(100vh-8rem)] w-full flex-col gap-6 py-4">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">👨‍⚕️ Дәрігерлер тізімі</h1>
        </header>

        <form className="grid gap-3 rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm md:grid-cols-4" method="GET">
          <input
            name="q"
            defaultValue={q}
            placeholder="🔍 Аты немесе мамандығы"
            className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <input
            name="specialization"
            defaultValue={specialization}
            placeholder="🏥 Мамандық"
            className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
            <input type="checkbox" name="available" value="1" defaultChecked={availableOnly} className="cursor-pointer" />
            ✅ Тек бос дәрігерлер
          </label>
          <button type="submit" className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-white font-semibold hover:shadow-lg transition">
            🔍 Іздеу
          </button>
        </form>

        {doctors.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200 shadow-sm">
            <p className="text-slate-600 text-lg">😔 Дәрігер табылмады. Басқа критерийлер сынап көріңіз.</p>
          </div>
        ) : (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {doctors.map((doctor) => (
              <article key={doctor.id} className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{doctor.user.name}</h2>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(() => {
                        try {
                          const specs = JSON.parse(doctor.specializations || "[]");
                          return (specs as string[]).map((spec, i) => (
                            <span key={i} className="inline-block text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-1 rounded">
                              {spec}
                            </span>
                          ));
                        } catch {
                          return <span className="text-sm text-slate-500">—</span>;
                        }
                      })()}
                    </div>
                  </div>
                  <span className="text-3xl">👨‍⚕️</span>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">📚 Тәжірибе:</span>
                    <span className="font-semibold text-slate-900">{doctor.experience} жыл</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">⭐ Рейтинг:</span>
                    <span className="font-semibold text-amber-600">{doctor.rating.toFixed(1)}/5.0 ({doctor.reviewCount})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">🟢 Статус:</span>
                    <span className={`font-semibold ${
                      doctor.isAvailable ? "text-emerald-600" : "text-red-600"
                    }`}>
                      {doctor.isAvailable ? "✅ Қолжетімді" : "🚫 Бос емес"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <Link href="/patient/appointments" className="flex-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-2 text-center text-sm font-semibold text-white hover:shadow-lg transition">
                    📅 Жазылу
                  </Link>
                  <Link href={`/patient/chat/${doctor.user.id}`} className="flex-1 rounded-lg border-2 border-cyan-600 px-3 py-2 text-center text-sm font-semibold text-cyan-600 hover:bg-cyan-50 transition">
                    💬 Чат
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
    </main>
  );
}
