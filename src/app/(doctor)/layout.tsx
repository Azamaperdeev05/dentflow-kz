import type { ReactNode } from "react";
import { DoctorHeader } from "@/components/doctor/doctor-header";

export const metadata = {
  title: "DentFlow KZ - Дәрігер",
};

export default function DoctorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <DoctorHeader />
      {children}
    </>
  );
}
