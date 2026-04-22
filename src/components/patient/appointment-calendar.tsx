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
  doctorId?: string;
};

export function AppointmentCalendar({ year, month, monthLabel, markers, doctorId }: Props) {
  const router = useRouter();

  return (
    <MonthCalendar
      year={year}
      month={month}
      monthLabel={monthLabel}
      markers={markers}
      disablePastDates
      onSelectDate={(dateKey) => {
        const url = doctorId 
          ? `/patient/appointments/${dateKey}?doctorId=${doctorId}` 
          : `/patient/appointments/${dateKey}`;
        router.push(url);
      }}
    />
  );
}
