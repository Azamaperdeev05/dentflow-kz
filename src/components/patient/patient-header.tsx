"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export function PatientHeader() {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/patient/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="DentFlow KZ" width={42} height={42} className="rounded-lg" priority />
          <span className="hidden text-xl font-bold text-slate-900 sm:inline">DentFlow KZ</span>
        </Link>

        {session && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{session.user?.name}</p>
              <p className="text-xs text-slate-500">Пациент</p>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-white transition hover:shadow-lg"
                title={session.user?.name || undefined}
              >
                {session.user?.name?.charAt(0).toUpperCase() || "U"}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="font-semibold text-slate-900">{session.user?.name}</p>
                    <p className="text-sm text-slate-600">{session.user?.email}</p>
                  </div>

                  <div className="py-2">
                    <Link
                      href="/patient/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Image src="/icons/windows11-outline/dashboard.png" alt="" width={16} height={16} />
                      Басты тақта
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <Image src="/icons/windows11-outline/logout.png" alt="" width={16} height={16} />
                      Шығу
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
