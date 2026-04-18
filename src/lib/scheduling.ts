export type WeekdayCode = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

const monthNamesKk = [
  "Қаңтар",
  "Ақпан",
  "Наурыз",
  "Сәуір",
  "Мамыр",
  "Маусым",
  "Шілде",
  "Тамыз",
  "Қыркүйек",
  "Қазан",
  "Қараша",
  "Желтоқсан",
];

const weekdayCodes: WeekdayCode[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const defaultWorkingDays: WeekdayCode[] = ["MON", "TUE", "WED", "THU", "FRI"];

const weekdayAliases: Record<string, WeekdayCode> = {
  SUN: "SUN",
  SUNDAY: "SUN",
  "ЖС": "SUN",
  MON: "MON",
  MONDAY: "MON",
  "ДС": "MON",
  TUE: "TUE",
  TUESDAY: "TUE",
  "СС": "TUE",
  WED: "WED",
  WEDNESDAY: "WED",
  "СР": "WED",
  THU: "THU",
  THURSDAY: "THU",
  "БС": "THU",
  FRI: "FRI",
  FRIDAY: "FRI",
  "ЖМ": "FRI",
  SAT: "SAT",
  SATURDAY: "SAT",
  "СН": "SAT",
};

export function getMonthLabelKk(year: number, monthIndex: number): string {
  return `${monthNamesKk[monthIndex]} ${year}`;
}

export function getDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDayKey(dayKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function getPreviousMonth(year: number, monthIndex: number) {
  if (monthIndex === 0) {
    return { year: year - 1, month: 11 };
  }

  return { year, month: monthIndex - 1 };
}

export function getNextMonth(year: number, monthIndex: number) {
  if (monthIndex === 11) {
    return { year: year + 1, month: 0 };
  }

  return { year, month: monthIndex + 1 };
}

export function getWeekdayCode(date: Date): WeekdayCode {
  return weekdayCodes[date.getDay()] ?? "SUN";
}

export function parseWorkDays(value: string | null | undefined): WeekdayCode[] {
  if (!value?.trim()) {
    return defaultWorkingDays;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      const normalized = parsed
        .map((item) => String(item).trim().toUpperCase())
        .map((item) => weekdayAliases[item] ?? null)
        .filter((item): item is WeekdayCode => Boolean(item));

      return normalized.length > 0 ? normalized : defaultWorkingDays;
    }
  } catch {
    // Fallback to comma-separated parsing below.
  }

  const fallback = value
    .split(/[;,\s]+/)
    .map((item) => item.trim().toUpperCase())
    .map((item) => weekdayAliases[item] ?? null)
    .filter((item): item is WeekdayCode => Boolean(item));

  return fallback.length > 0 ? fallback : defaultWorkingDays;
}

export function isWorkingDay(workDays: string | null | undefined, date: Date): boolean {
  const workingDays = parseWorkDays(workDays);
  return workingDays.includes(getWeekdayCode(date));
}

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  return hours * 60 + minutes;
}

export function minutesToTime(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function combineDateAndTime(dateKey: string, time: string): Date | null {
  const date = parseDayKey(dateKey);
  if (!date) {
    return null;
  }

  const [hours, minutes] = time.split(":").map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
}

export function buildTimeSlots(start: string, end: string, slotDurationMinutes: number): string[] {
  const slots: string[] = [];
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  for (let cursor = startMinutes; cursor + slotDurationMinutes <= endMinutes; cursor += slotDurationMinutes) {
    slots.push(minutesToTime(cursor));
  }

  return slots;
}

export function getAppointmentTypeDurationMinutes(type: string, baseDurationMinutes: number): number {
  if (type === "TREATMENT" || type === "EMERGENCY") {
    return baseDurationMinutes * 2;
  }

  return baseDurationMinutes;
}

export function getMaxAppointmentTypeDurationMinutes(baseDurationMinutes: number): number {
  return baseDurationMinutes * 2;
}

export function isTimeWithinWorkingHours(time: string, start: string, end: string, slotDurationMinutes: number): boolean {
  const candidate = timeToMinutes(time);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  return candidate >= startMinutes && candidate + slotDurationMinutes <= endMinutes;
}
