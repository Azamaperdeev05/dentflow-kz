import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { requireDoctorPage } from "@/lib/session";
import { DoctorNav } from "@/components/doctor/doctor-nav";
import { decryptSecret } from "@/lib/secret-crypto";

export default async function DoctorMessagesPage() {
  const { user } = await requireDoctorPage();

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: user.id }, { receiverId: user.id }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
    take: 300,
  });

  const seen = new Set<string>();
  const conversations = messages
    .map((message) => {
      const otherUser = message.senderId === user.id ? message.receiver : message.sender;
      return {
        otherUser,
        lastMessage: message,
      };
    })
    .filter((item) => {
      if (seen.has(item.otherUser.id)) {
        return false;
      }
      seen.add(item.otherUser.id);
      return true;
    });

  // Calculate unread status for each conversation
  const conversationsWithStatus = await Promise.all(conversations.map(async (conv) => {
    const unreadCount = await prisma.message.count({
      where: {
        senderId: conv.otherUser.id,
        receiverId: user.id,
        isRead: false
      }
    });
    return { ...conv, isUnread: unreadCount > 0 };
  }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row">
      <DoctorNav />

      <section className="min-w-0 flex-1 space-y-6">
        <header className="space-y-4">
          <h1 className="flex items-center gap-3 text-4xl font-bold text-slate-900">
            <Image src="/icons/windows11-filled/messages.png" alt="" width={36} height={36} />
            Хабарламалар
          </h1>
        </header>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
          {conversations.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center border border-slate-200">
              <p className="text-slate-600">😔 Әзірге хат алмасулар жоқ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversationsWithStatus.map((conv) => (
                <article key={conv.otherUser.id} className={`flex items-center justify-between rounded-xl border p-5 hover:shadow-md transition ${
                  conv.isUnread ? "border-cyan-200 bg-cyan-50/30 ring-1 ring-cyan-100" : "border-slate-200 bg-gradient-to-br from-slate-50 to-white"
                }`}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-semibold flex-shrink-0">
                        {conv.otherUser.name?.charAt(0).toUpperCase()}
                      </div>
                      {conv.isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className={`font-bold text-slate-900 ${conv.isUnread ? "text-cyan-900" : ""}`}>{conv.otherUser.name}</h2>
                        {conv.isUnread && <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-600 uppercase tracking-tighter">Жаңа</span>}
                      </div>
                      <p className={`mt-1 text-sm line-clamp-1 ${conv.isUnread ? "font-bold text-slate-900" : "text-slate-600"}`}>
                        &quot;{conv.lastMessage.isEncrypted 
                          ? (decryptSecret(conv.lastMessage.content) || (conv.lastMessage.fileName ? `📎 ${conv.lastMessage.fileName}` : "[Шифрланған]"))
                          : (conv.lastMessage.content || (conv.lastMessage.fileName ? `📎 ${conv.lastMessage.fileName}` : ""))}
                        {conv.lastMessage.content?.length > 60 ? "..." : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(conv.lastMessage.createdAt).toLocaleString("kk-KZ")}</p>
                    </div>
                  </div>
                  <Link href={`/doctor/chat/${conv.otherUser.id}`} className="ml-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition flex-shrink-0">
                    <span className="inline-flex items-center gap-2"><Image src="/icons/windows11-filled/messages.png" alt="" width={15} height={15} />Ашу</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
