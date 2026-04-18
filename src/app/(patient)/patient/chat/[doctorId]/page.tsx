import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUserPage } from "@/lib/session";
import { ChatBox } from "@/components/shared/chat-box";

type Props = {
  params: {
    doctorId: string;
  };
};

export default async function PatientChatPage({ params }: Props) {
  const user = await requireSessionUserPage();

  const doctorUser = await prisma.user.findUnique({
    where: { id: params.doctorId },
    include: { doctorProfile: true },
  });

  if (!doctorUser || !doctorUser.doctorProfile) {
    notFound();
  }

  return (
    <section className="min-w-0 space-y-4">
      <header className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Чат бөлмесі</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{doctorUser.name}</h1>
        <p className="mt-2 text-sm text-slate-600">Дәрігермен тікелей байланыс. Хабарлама енгізу төменде.</p>
      </header>

      <ChatBox
        otherUserId={doctorUser.id}
        currentUserId={user.id}
        title={doctorUser.name}
        subtitle="Дәрігермен тікелей хабар алмасу"
      />
    </section>
  );
}
