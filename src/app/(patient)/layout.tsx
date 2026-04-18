import type { ReactNode } from "react";
import { PatientHeader } from "@/components/patient/patient-header";
import { PatientNav } from "@/components/patient/patient-nav";

export const metadata = {
  title: "DentFlow KZ - Пациент",
};

export default function PatientLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <PatientHeader />
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PatientNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}
