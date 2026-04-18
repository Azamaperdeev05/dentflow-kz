import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { requireDoctorPage } from "@/lib/session";
import { DoctorNav } from "@/components/doctor/doctor-nav";
import { CreateTreatmentForm } from "@/components/doctor/create-treatment-form";
import { getTreatmentStatusLabel } from "@/lib/kz-labels";
import { parseTreatmentMeta, parseTreatmentStages } from "@/lib/treatment-plan";

type Props = {
  params: {
    patientId: string;
  };
};

export default async function TreatmentPlanPage({ params }: Props) {
  const { doctorProfile } = await requireDoctorPage();

  const patient = await prisma.patientProfile.findUnique({
    where: { id: params.patientId },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      appointments: {
        where: { doctorId: doctorProfile.id },
        select: { id: true },
      },
    },
  });

  if (!patient || patient.appointments.length === 0) {
    notFound();
  }

  const treatments = await prisma.treatment.findMany({
    where: { patientId: patient.id },
    orderBy: { startDate: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">Емдеу жоспары: {patient.user.name}</h1>
        <DoctorNav />
      </header>

      <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200 text-sm text-slate-700">
        <p>Телефон: {patient.user.phone || "-"}</p>
        <p>Email: {patient.user.email}</p>
      </section>

      <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Тіс түрлері</h2>
        <p className="mt-1 text-sm text-slate-600">Тіс сұлбасы бойынша негізгі 4 топ және саны.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Күрек тістер", count: "8", desc: "Тамақты кесуге арналған алдыңғы тістер." },
            { title: "Ит тістер", count: "4", desc: "Жыртуға және ұстап тұруға бейім тістер." },
            { title: "Кіші азу тістер", count: "8", desc: "Тағамды жаншып ұсақтауға қатысады." },
            { title: "Үлкен азу тістер", count: "8-12", desc: "Негізгі шайнау күшін атқаратын тістер." },
          ].map((item) => (
            <article key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200">
                  <Image src="/icons/windows11-filled/tooth.png" alt={item.title} width={26} height={26} className="object-contain" />
                </div>
                <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700">Саны: {item.count}</span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <CreateTreatmentForm patientProfileId={patient.id} />

      <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Емдеу тарихы</h2>
        {treatments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Емдеу жоспары әлі құрылмаған.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {treatments.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 p-4 text-sm text-slate-700">
                {(() => {
                  const stages = parseTreatmentStages(item.procedures);
                  const meta = parseTreatmentMeta(item.notes);
                  const remaining = Math.max(item.totalCost - item.paidAmount, 0);

                  return (
                    <>
                <p className="text-slate-500">{new Date(item.startDate).toLocaleDateString("kk-KZ")}</p>
                <h3 className="font-semibold text-slate-900">{item.diagnosis}</h3>
                <p>Статус: {getTreatmentStatusLabel(item.status)}</p>
                <p>Құны: {item.totalCost.toLocaleString("kk-KZ")} тг</p>
                <p>Төленген: {item.paidAmount.toLocaleString("kk-KZ")} тг</p>
                <p>Қалғаны: {remaining.toLocaleString("kk-KZ")} тг</p>
                <p>Бекіту: {meta.approvedByPatient ? "Пациент бекітті" : "Бекітілмеген"}</p>
                {stages.length > 0 ? (
                  <ul className="mt-2 space-y-1 rounded bg-slate-50 p-2 text-xs">
                    {stages.map((stage, index) => (
                      <li key={stage.id} className="flex items-center justify-between">
                        <span>{index + 1}. {stage.title}</span>
                        <strong>{stage.cost.toLocaleString("kk-KZ")} тг</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-2 text-xs">{item.procedures}</pre>
                )}
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
