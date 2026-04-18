"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import Image from "next/image";

export function DoctorHeader() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/doctor/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="DentFlow KZ" width={42} height={42} className="rounded-lg" priority />
          <span className="hidden text-xl font-bold text-slate-900 sm:inline">DentFlow KZ</span>
        </Link>

        {session && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{session.user?.name}</p>
              <p className="text-xs text-slate-500">Дәрігер</p>
            </div>

            <Link
              href="/doctor/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white transition hover:shadow-lg"
              title="Профиль"
            >
                {session.user?.name?.charAt(0).toUpperCase() || "D"}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
