"use client";

import { useState, useRef, useEffect } from "react";

type ToothStatus = "HEALTHY" | "CAVITY" | "FILLING" | "CROWN" | "EXTRACTION" | "IMPLANT";

type Tooth = {
  id: number;
  status: ToothStatus;
  procedure?: string;
  cost?: number;
};

type Props = {
  teeth: Tooth[];
  onToothStatusChange?: (toothId: number, status: ToothStatus) => void;
  readOnly?: boolean;
};

const STATUS_OPTIONS: { value: ToothStatus; label: string; dot: string }[] = [
  { value: "HEALTHY", label: "Сау", dot: "bg-white border border-slate-300" },
  { value: "CAVITY", label: "Кариес", dot: "bg-red-500" },
  { value: "FILLING", label: "Пломба", dot: "bg-yellow-500" },
  { value: "CROWN", label: "Тәж", dot: "bg-blue-500" },
  { value: "EXTRACTION", label: "Алу", dot: "bg-gray-500" },
  { value: "IMPLANT", label: "Имплант", dot: "bg-green-500" },
];

const TOOTH_COLORS: Record<ToothStatus, { bg: string; border: string; fill: string }> = {
  HEALTHY: { bg: "bg-white", border: "border-slate-300", fill: "text-slate-400" },
  CAVITY: { bg: "bg-red-50", border: "border-red-400", fill: "text-red-500" },
  FILLING: { bg: "bg-yellow-50", border: "border-yellow-500", fill: "text-yellow-600" },
  CROWN: { bg: "bg-blue-50", border: "border-blue-500", fill: "text-blue-500" },
  EXTRACTION: { bg: "bg-gray-100", border: "border-gray-400", fill: "text-gray-400" },
  IMPLANT: { bg: "bg-green-50", border: "border-green-500", fill: "text-green-500" },
};

function ToothIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="18" height="18">
      <path d="M12 2C9.5 2 7.5 3.2 6.8 5.1C6.1 7 5 9.5 5 11.5C5 13.5 5.5 15 6.2 16.5C6.9 18 7.5 19.5 8 20.5C8.5 21.5 9.5 22 10.5 22C11.2 22 11.7 21.6 12 21C12.3 21.6 12.8 22 13.5 22C14.5 22 15.5 21.5 16 20.5C16.5 19.5 17.1 18 17.8 16.5C18.5 15 19 13.5 19 11.5C19 9.5 17.9 7 17.2 5.1C16.5 3.2 14.5 2 12 2Z" />
    </svg>
  );
}

export function ToothFormula({ teeth, onToothStatusChange, readOnly = false }: Props) {
  const [popoverToothId, setPopoverToothId] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverToothId(null);
      }
    }
    if (popoverToothId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [popoverToothId]);

  const handleSelect = (toothId: number, status: ToothStatus) => {
    onToothStatusChange?.(toothId, status);
    setPopoverToothId(null);
  };

  const renderTooth = (id: number, popoverDirection: "up" | "down") => {
    const tooth = teeth.find((t) => t.id === id);
    const status = tooth?.status ?? "HEALTHY";
    const colors = TOOTH_COLORS[status];
    const isOpen = popoverToothId === id;

    return (
      <div key={id} className="relative">
        <button
          type="button"
          onClick={() => {
            if (readOnly) return;
            setPopoverToothId(isOpen ? null : id);
          }}
          disabled={readOnly}
          className={`flex h-11 w-11 flex-col items-center justify-center rounded-lg border-2 transition-all ${colors.bg} ${colors.border} ${
            !readOnly ? "cursor-pointer hover:shadow-md hover:scale-105" : "cursor-default"
          } ${isOpen ? "ring-2 ring-cyan-400 shadow-md" : ""}`}
          title={`#${id}`}
        >
          <ToothIcon className={`${colors.fill} h-4 w-4`} />
          <span className="text-[9px] font-bold leading-none text-slate-600">{id}</span>
        </button>

        {isOpen && !readOnly && (
          <div
            ref={popoverRef}
            className={`absolute z-50 w-32 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ${
              popoverDirection === "down" ? "top-full mt-1.5" : "bottom-full mb-1.5"
            } left-1/2 -translate-x-1/2`}
          >
            <p className="mb-1 px-1.5 text-[10px] font-bold text-slate-400">#{id}</p>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(id, opt.value)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                  status === opt.value
                    ? "bg-cyan-50 text-cyan-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${opt.dot}`} />
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h3 className="mb-3 text-lg font-semibold text-slate-900">Тіс формуласы (FDI)</h3>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        {STATUS_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${opt.dot}`} />
            {opt.label}
          </div>
        ))}
      </div>

      {/* Upper Jaw */}
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Жоғарғы жақ</p>
          <div className="flex justify-center gap-0.5">
            <div className="flex gap-0.5">
              {[18, 17, 16, 15, 14, 13, 12, 11].map((id) => renderTooth(id, "down"))}
            </div>
            <div className="mx-1 w-px bg-slate-200" />
            <div className="flex gap-0.5">
              {[21, 22, 23, 24, 25, 26, 27, 28].map((id) => renderTooth(id, "down"))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-auto h-px w-3/4 bg-slate-200" />

        {/* Lower Jaw */}
        <div>
          <p className="mb-1.5 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Төменгі жақ</p>
          <div className="flex justify-center gap-0.5">
            <div className="flex gap-0.5">
              {[48, 47, 46, 45, 44, 43, 42, 41].map((id) => renderTooth(id, "up"))}
            </div>
            <div className="mx-1 w-px bg-slate-200" />
            <div className="flex gap-0.5">
              {[31, 32, 33, 34, 35, 36, 37, 38].map((id) => renderTooth(id, "up"))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>{readOnly ? "Емдеу жоспарын көру" : "Тісті басып жағдайын таңдаңыз"}</span>
        <span>{teeth.filter((t) => t.status !== "HEALTHY").length} / 32 белгіленген</span>
      </div>
    </div>
  );
}
