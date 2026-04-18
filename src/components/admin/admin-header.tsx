"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import Image from "next/image";

export function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/admin/security" className="flex items-center gap-2">
          <Image src="/logo.png" alt="DentFlow KZ" width={42} height={42} className="rounded-lg" priority />
          <span className="hidden text-xl font-bold text-slate-900 sm:inline">DentFlow KZ</span>
        </Link>

        {session && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{session.user?.name}</p>
              <p className="text-xs text-slate-500">Админ</p>
            </div>

            <Link
              href="/admin/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white transition hover:shadow-lg"
              title="Admin profile"
            >
              {session.user?.name?.charAt(0).toUpperCase() || "A"}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
