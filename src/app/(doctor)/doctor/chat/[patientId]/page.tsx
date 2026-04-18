import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireDoctorPage } from "@/lib/session";
import { DoctorNav } from "@/components/doctor/doctor-nav";
import { ChatBox } from "@/components/shared/chat-box";

type Props = {
  params: {
    patientId: string;
  };
};

export default async function DoctorChatPage({ params }: Props) {
  const { user } = await requireDoctorPage();

  const patientUser = await prisma.user.findUnique({
    where: { id: params.patientId },
    include: { patientProfile: true },
  });

  if (!patientUser || !patientUser.patientProfile) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row">
      <DoctorNav />

      <section className="min-w-0 flex-1 space-y-4">
        <header className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Чат бөлмесі</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{patientUser.name}</h1>
          <p className="mt-2 text-sm text-slate-600">Пациентпен тікелей хабар алмасу. Хабарлама енгізу төменде.</p>
        </header>

        <ChatBox
          otherUserId={patientUser.id}
          currentUserId={user.id}
          title={patientUser.name}
          subtitle="Пациентпен тікелей хабар алмасу"
        />
      </section>
    </main>
  );
}
