"use client";

import { useRouter } from "next/navigation";
import { MonthCalendar } from "@/components/shared/month-calendar";

type DayMarker = {
  hasAppointments?: boolean;
  hasCompletedTreatments?: boolean;
  isUnavailableDay?: boolean;
};

type Props = {
  year: number;
  month: number;
  monthLabel: string;
  markers: Record<string, DayMarker>;
};

export function DoctorScheduleCalendar({ year, month, monthLabel, markers }: Props) {
  const router = useRouter();

  return (
    <MonthCalendar
      year={year}
      month={month}
      monthLabel={monthLabel}
      markers={markers}
      onSelectDate={(dateKey) => {
        router.push(`/doctor/schedule/${dateKey}`);
      }}
    />
  );
}
