"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UnreadMessageCount } from "@/components/shared/unread-message-count";

const links = [
  { href: "/patient/dashboard", label: "Басты тақта", icon: "/icons/windows11-outline/dashboard.png" },
  { href: "/patient/doctors", label: "Дәрігерлер", icon: "/icons/windows11-outline/doctor.png" },
  { href: "/patient/appointments", label: "Қабылдаулар", icon: "/icons/windows11-outline/calendar.png" },
  { href: "/patient/medical-history", label: "Медициналық тарих", icon: "/icons/windows11-outline/medical-history.png" },
  { href: "/patient/messages", label: "Хабарламалар", icon: "/icons/windows11-outline/messages.png" },
];

export function PatientNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const renderLinks = (onNavigate?: () => void) => (
    <>
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
              isActive
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <Image src={link.icon} alt="" width={18} height={18} className={`${isActive ? "opacity-100" : "opacity-80"}`} />
              <span>{link.label}</span>
            </div>
            {link.href === "/patient/messages" && <UnreadMessageCount />}
          </Link>
        );
      })}
    </>
  );

  const renderProfile = (onNavigate?: () => void) => (
    <div className="mt-6 border-t border-slate-200 pt-4">
      <Link
        href="/profile"
        onClick={onNavigate}
        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
          pathname === "/profile"
            ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm"
            : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <Image
            src="/icons/windows11-outline/profile.png"
            alt=""
            width={18}
            height={18}
            className={`${pathname === "/profile" ? "opacity-100" : "opacity-80"}`}
          />
          <span>Профил</span>
        </div>
      </Link>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg lg:hidden"
      >
        Меню
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 lg:hidden" onClick={() => setIsOpen(false)}>
          <aside
            className="h-full w-72 bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Пациент мәзірі</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-600"
              >
                Жабу
              </button>
            </div>
            <nav className="space-y-1">{renderLinks(() => setIsOpen(false))}</nav>
            {renderProfile(() => setIsOpen(false))}
          </aside>
        </div>
      )}

      <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-y-auto lg:block">
        <p className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Навигация</p>
        <nav className="space-y-1">{renderLinks()}</nav>
        {renderProfile()}
      </aside>
    </>
  );
}
