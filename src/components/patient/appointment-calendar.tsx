"use client";

import { useRouter } from "next/navigation";
import { MonthCalendar } from "@/components/shared/month-calendar";

type DayMarker = {
  isUnavailableDay?: boolean;
};

type Props = {
  year: number;
  month: number;
  monthLabel: string;
  markers: Record<string, DayMarker>;
};

export function AppointmentCalendar({ year, month, monthLabel, markers }: Props) {
  const router = useRouter();

  return (
    <MonthCalendar
      year={year}
      month={month}
      monthLabel={monthLabel}
      markers={markers}
      onSelectDate={(dateKey) => {
        router.push(`/patient/appointments/${dateKey}`);
      }}
    />
  );
}
