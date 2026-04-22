import { prisma } from "@/lib/db";
import Image from "next/image";
import { requirePatientPage } from "@/lib/session";
import { getTreatmentStatusLabel } from "@/lib/kz-labels";
import { ApproveTreatmentButton } from "@/components/patient/approve-treatment-button";
import { parseTreatmentMeta, parseTreatmentStages } from "@/lib/treatment-plan";
import { MedicalFileUploadForm } from "@/components/patient/medical-file-upload-form";
import { FilePreviewButton } from "@/components/patient/file-preview-button";

export default async function MedicalHistoryPage() {
  const { patientProfile } = await requirePatientPage();

  const [treatments, files] = await Promise.all([
    prisma.treatment.findMany({
      where: { patientId: patientProfile.id },
      orderBy: { startDate: "desc" },
    }),
    prisma.medicalFile.findMany({
      where: { patientId: patientProfile.id },
      orderBy: { uploadedAt: "desc" },
    }),
  ]);

  return (
    <main className="flex min-h-[calc(100vh-8rem)] w-full flex-col gap-6 py-4">
        <header className="space-y-4">
          <h1 className="flex items-center gap-3 text-4xl font-bold text-slate-900">
            <Image src="/icons/windows11-filled/medical-history.png" alt="" width={36} height={36} />
            Медициналық тарих
          </h1>
        </header>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Image src="/icons/windows11-outline/treatment.png" alt="" width={22} height={22} />
            Емдеу жазбалары
          </h2>

          {treatments.length === 0 ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-6 text-center border border-slate-200">
              <p className="text-slate-600">😔 Емдеу жазбалары жоқ</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {treatments.map((treatment) => (
                <article key={treatment.id} className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition bg-gradient-to-r from-white to-slate-50">
                  {(() => {
                    const stages = parseTreatmentStages(treatment.procedures);
                    const meta = parseTreatmentMeta(treatment.notes);
                    const remaining = Math.max(treatment.totalCost - treatment.paidAmount, 0);

                    return (
                      <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="inline-flex items-center gap-1 text-xs text-slate-500 font-semibold uppercase tracking-wide"><Image src="/icons/windows11-outline/calendar.png" alt="" width={14} height={14} />Күні</p>
                      <p className="text-sm font-semibold text-slate-900">{new Date(treatment.startDate).toLocaleDateString("kk-KZ")}</p>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      treatment.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : treatment.status === "ACTIVE"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {getTreatmentStatusLabel(treatment.status)}
                    </span>
                  </div>
                  <h3 className="mt-3 inline-flex items-center gap-2 font-semibold text-slate-900"><Image src="/icons/windows11-outline/medical-history.png" alt="" width={16} height={16} />Диагноз: {treatment.diagnosis}</h3>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div className="text-sm">
                      <p className="inline-flex items-center gap-1 text-slate-600"><Image src="/icons/windows11-outline/finance.png" alt="" width={14} height={14} />Жалпы құны</p>
                      <p className="font-semibold text-slate-900">{treatment.totalCost.toLocaleString("kk-KZ")} ₸</p>
                    </div>
                    <div className="text-sm">
                      <p className="inline-flex items-center gap-1 text-slate-600"><Image src="/icons/windows11-outline/dashboard.png" alt="" width={14} height={14} />Төленгені</p>
                      <p className="font-semibold text-green-600">{treatment.paidAmount.toLocaleString("kk-KZ")} ₸</p>
                    </div>
                    <div className="text-sm">
                      <p className="inline-flex items-center gap-1 text-slate-600"><Image src="/icons/windows11-outline/finance.png" alt="" width={14} height={14} />Қалғаны</p>
                      <p className="font-semibold text-amber-600">{remaining.toLocaleString("kk-KZ")} ₸</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Емдеу кезеңдері</p>
                    {stages.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">Кезеңдер енгізілмеген</p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {stages.map((stage, index) => (
                          <li key={stage.id} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                            <span>{index + 1}. {stage.title}</span>
                            <span className="font-semibold">{stage.cost.toLocaleString("kk-KZ")} ₸</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-medium text-slate-700">
                      Жоспар күйі: {meta.approvedByPatient ? "Пациент бекітті" : "Бекітілмеген"}
                    </p>
                    <ApproveTreatmentButton treatmentId={treatment.id} approved={Boolean(meta.approvedByPatient)} />
                  </div>
                      </>
                    );
                  })()}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Image src="/icons/windows11-outline/medical-history.png" alt="" width={22} height={22} />
            Медициналық файлдар
          </h2>

          <p className="mt-2 text-sm text-slate-600">Фото, рентген немесе құжатты жүктей аласыз. Жүктелген файл бірден деректер базасына сақталады.</p>

          <MedicalFileUploadForm />

          {files.length === 0 ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-6 text-center border border-slate-200">
              <p className="text-slate-600">😔 Файлдар жоқ</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-700 font-semibold">
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/medical-history.png" alt="" width={15} height={15} />Атауы</span></th>
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/treatment.png" alt="" width={15} height={15} />Түрі</span></th>
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/dashboard.png" alt="" width={15} height={15} />Өлшемі</span></th>
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/calendar.png" alt="" width={15} height={15} />Жүктелген күні</span></th>
                    <th className="py-3 px-4"><span className="inline-flex items-center gap-2"><Image src="/icons/windows11-outline/messages.png" alt="" width={15} height={15} />Сілтеме</span></th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, idx) => (
                    <tr key={file.id} className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}>
                      <td className="py-3 px-4 font-medium text-slate-900">{file.name}</td>
                      <td className="py-3 px-4 text-slate-700">{file.type}</td>
                      <td className="py-3 px-4 text-slate-700">{Math.round(file.size / 1024)} KB</td>
                      <td className="py-3 px-4 text-slate-700">{new Date(file.uploadedAt).toLocaleDateString("kk-KZ")}</td>
                      <td className="py-3 px-4">
                        <FilePreviewButton url={file.url} name={file.name} type={file.type} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
    </main>
  );
}
