"use client";

type DayMarker = {
  hasAppointments?: boolean;
  hasCompletedTreatments?: boolean;
  isUnavailableDay?: boolean;
};

type Props = {
  year: number;
  month: number;
  monthLabel?: string;
  markers?: Record<string, DayMarker>;
  selectedDate?: string;
  onSelectDate?: (dateKey: string) => void;
};

const weekDays = ["Дс", "Сс", "Ср", "Бс", "Жм", "Сн", "Жс"];

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function MonthCalendar({ year, month, monthLabel, markers = {}, selectedDate, onSelectDate }: Props) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = monthLabel ?? firstDay.toLocaleDateString("kk-KZ", { month: "long", year: "numeric" });

  // Monday-based index: 0..6
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells: Array<{ key: string; day?: number }> = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ key: `empty-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = formatDateKey(date);
    cells.push({ key: dateKey, day });
  }

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold capitalize text-slate-900">{monthName}</h3>

      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
        {weekDays.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {cells.map((cell) => {
          if (!cell.day) {
            return <div key={cell.key} className="h-12 rounded-lg bg-slate-50/60" />;
          }

          const marker = markers[cell.key];
          const isSelected = selectedDate === cell.key;
          const isUnavailableDay = marker?.isUnavailableDay ?? false;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelectDate?.(cell.key)}
              disabled={!onSelectDate || isUnavailableDay}
              className={`relative h-12 rounded-lg border text-sm font-medium transition ${
                isUnavailableDay
                  ? "border-red-200 bg-red-50 text-red-600"
                  : isSelected
                  ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50/40"
              } ${!onSelectDate || isUnavailableDay ? "cursor-not-allowed" : ""}`}
            >
              {cell.day}

              {(marker?.hasAppointments || marker?.hasCompletedTreatments || marker?.isUnavailableDay) && (
                <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1">
                  {marker.hasAppointments && <span className="h-2 w-2 rounded-full bg-blue-500" title="Клиент келген күн" />}
                  {marker.hasCompletedTreatments && <span className="h-2 w-2 rounded-full bg-emerald-500" title="Емделген күн" />}
                  {marker.isUnavailableDay && <span className="h-2 w-2 rounded-full bg-red-500" title="Демалыс немесе бос орын жоқ" />}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
