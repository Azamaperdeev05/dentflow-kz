"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";

export function DoctorSignOutButton() {
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
    >
      <Image src="/icons/windows11-outline/logout.png" alt="" width={16} height={16} />
      Шығу
    </button>
  );
}
