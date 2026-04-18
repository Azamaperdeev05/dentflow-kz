import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { requireDoctorPage } from "@/lib/session";
import { DoctorNav } from "@/components/doctor/doctor-nav";

type Props = {
  searchParams: {
    q?: string;
  };
};

export default async function DoctorPatientsPage({ searchParams }: Props) {
  const { doctorProfile } = await requireDoctorPage();
  const q = searchParams.q?.trim() ?? "";

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctorProfile.id,
      ...(q
        ? {
            patient: {
              user: {
                OR: [
                  { name: { contains: q } },
                  { phone: { contains: q } },
                ],
              },
            },
          }
        : {}),
    },
    include: {
      patient: {
        include: {
          user: {
            select: { name: true, phone: true, email: true },
          },
        },
      },
    },
    orderBy: { dateTime: "desc" },
  });

  const seen = new Set<string>();
  const patients = appointments
    .map((item) => item.patient)
    .filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row">
      <DoctorNav />

      <section className="min-w-0 flex-1 space-y-6">
        <header className="space-y-4">
          <h1 className="flex items-center gap-3 text-4xl font-bold text-slate-900">
            <Image src="/icons/windows11-filled/patients.png" alt="" width={36} height={36} />
            Пациенттер
          </h1>
        </header>

        <form method="GET" className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
          <div className="flex gap-3">
            <input name="q" defaultValue={q} placeholder="Аты немесе телефон" className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            <button type="submit" className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2 text-sm font-semibold text-white hover:shadow-lg transition">
              <span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/medical-history.png" alt="" width={15} height={15} />Іздеу</span>
            </button>
          </div>
        </form>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
          {patients.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center border border-slate-200">
              <p className="text-slate-600">😔 Пациент табылмады</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {patients.map((patient) => (
                <article key={patient.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-5 hover:shadow-md transition bg-gradient-to-br from-slate-50 to-white">
                  <div>
                    <h2 className="inline-flex items-center gap-2 font-bold text-slate-900 text-lg"><Image src="/icons/windows11-outline/profile.png" alt="" width={16} height={16} />{patient.user.name}</h2>
                    <p className="text-sm text-slate-600 mt-1">{patient.user.phone || "Телефон жоқ"}</p>
                    <p className="text-sm text-slate-600">{patient.user.email}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link href={`/doctor/treatment/${patient.id}`} className="flex-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-2 text-sm font-semibold text-white hover:shadow-lg transition text-center">
                      <span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/treatment.png" alt="" width={15} height={15} />Емдеу</span>
                    </Link>
                    <Link href={`/doctor/chat/${patient.userId}`} className="flex-1 rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100 transition text-center">
                      <span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/messages.png" alt="" width={15} height={15} />Чат</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
