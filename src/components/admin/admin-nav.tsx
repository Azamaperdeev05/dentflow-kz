"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/admin/dashboard", label: "Дашборд", icon: "/icons/windows11-outline/dashboard.png" },
  { href: "/admin/doctors", label: "Дәрігерлер", icon: "/icons/windows11-outline/doctor.png" },
  { href: "/admin/security", label: "Қауіпсіздік панелі", icon: "/icons/windows11-outline/settings.png" },
  { href: "/admin/profile", label: "Профиль және 2FA", icon: "/icons/windows11-outline/profile.png" },
];

export function AdminNav() {
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
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
              isActive
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Image src={link.icon} alt="" width={18} height={18} className={`${isActive ? "opacity-100" : "opacity-80"}`} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-lg lg:hidden"
      >
        Меню
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 lg:hidden" onClick={() => setIsOpen(false)}>
          <aside className="h-full w-72 bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Админ мәзірі</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-600"
              >
                Жабу
              </button>
            </div>
            <nav className="space-y-1">{renderLinks(() => setIsOpen(false))}</nav>
          </aside>
        </div>
      )}

      <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-y-auto lg:block">
        <p className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Admin Security</p>
        <nav className="space-y-1">{renderLinks()}</nav>
      </aside>
    </>
  );
}
