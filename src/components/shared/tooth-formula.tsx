"use client";

import { useState } from "react";
import Image from "next/image";

type ToothStatus = "HEALTHY" | "CAVITY" | "FILLING" | "CROWN" | "EXTRACTION" | "IMPLANT";

type Tooth = {
  id: number;
  status: ToothStatus;
  procedure?: string;
  cost?: number;
};

type Props = {
  teeth: Tooth[];
  onToothClick: (toothId: number) => void;
  readOnly?: boolean;
};

export function ToothFormula({ teeth, onToothClick, readOnly = false }: Props) {
  const getToothColor = (status: ToothStatus): string => {
    switch (status) {
      case "HEALTHY":
        return "bg-white border-slate-300";
      case "CAVITY":
        return "bg-red-100 border-red-500";
      case "FILLING":
        return "bg-yellow-100 border-yellow-600";
      case "CROWN":
        return "bg-blue-100 border-blue-600";
      case "EXTRACTION":
        return "bg-gray-200 border-gray-500";
      case "IMPLANT":
        return "bg-green-100 border-green-600";
      default:
        return "bg-white border-slate-300";
    }
  };

  const getToothLabel = (status: ToothStatus): string => {
    switch (status) {
      case "HEALTHY":
        return "Сау";
      case "CAVITY":
        return "Кариес";
      case "FILLING":
        return "Пломба";
      case "CROWN":
        return "Тәж";
      case "EXTRACTION":
        return "Алу";
      case "IMPLANT":
        return "Имплант";
      default:
        return "";
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Тіс формуласы (FDI)</h3>

      {/* Legend */}
      <div className="mb-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-6">
        {(["HEALTHY", "CAVITY", "FILLING", "CROWN", "EXTRACTION", "IMPLANT"] as const).map(
          (status) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`h-4 w-4 rounded border ${getToothColor(status)}`} />
              <span className="text-slate-600">{getToothLabel(status)}</span>
            </div>
          )
        )}
      </div>

      {/* Tooth Grid */}
      <div className="space-y-6">
        {/* Upper Jaw */}
        <div>
          <p className="mb-2 text-center text-sm font-semibold text-slate-500">ЖОҒ. ТІС</p>
          <div className="flex justify-center gap-1">
            {/* Upper Right (reverse order for visual) */}
            <div className="flex gap-1">
              {[18, 17, 16, 15, 14, 13, 12, 11].map((id) => {
                const tooth = teeth.find((t) => t.id === id);
                return (
                  <button
                    key={id}
                    onClick={() => !readOnly && onToothClick(id)}
                    disabled={readOnly}
                    className={`h-12 w-12 rounded border-2 p-1 text-xs font-bold transition ${
                      tooth ? getToothColor(tooth.status) : "bg-white border-slate-300"
                    } ${!readOnly && "hover:shadow-md"} disabled:cursor-default`}
                    title={tooth ? getToothLabel(tooth.status) : ""}
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Image src="/icons/windows11-filled/tooth.png" alt="Тіс" width={14} height={14} className="object-contain" />
                      <span className="text-[10px] leading-none">{id}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Upper Left */}
            <div className="flex gap-1">
              {[21, 22, 23, 24, 25, 26, 27, 28].map((id) => {
                const tooth = teeth.find((t) => t.id === id);
                return (
                  <button
                    key={id}
                    onClick={() => !readOnly && onToothClick(id)}
                    disabled={readOnly}
                    className={`h-12 w-12 rounded border-2 p-1 text-xs font-bold transition ${
                      tooth ? getToothColor(tooth.status) : "bg-white border-slate-300"
                    } ${!readOnly && "hover:shadow-md"} disabled:cursor-default`}
                    title={tooth ? getToothLabel(tooth.status) : ""}
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Image src="/icons/windows11-filled/tooth.png" alt="Тіс" width={14} height={14} className="object-contain" />
                      <span className="text-[10px] leading-none">{id}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lower Jaw */}
        <div>
          <p className="mb-2 text-center text-sm font-semibold text-slate-500">ТӨМЕН. ТІС</p>
          <div className="flex justify-center gap-1">
            {/* Lower Left (reverse order for visual) */}
            <div className="flex gap-1">
              {[38, 37, 36, 35, 34, 33, 32, 31].map((id) => {
                const tooth = teeth.find((t) => t.id === id);
                return (
                  <button
                    key={id}
                    onClick={() => !readOnly && onToothClick(id)}
                    disabled={readOnly}
                    className={`h-12 w-12 rounded border-2 p-1 text-xs font-bold transition ${
                      tooth ? getToothColor(tooth.status) : "bg-white border-slate-300"
                    } ${!readOnly && "hover:shadow-md"} disabled:cursor-default`}
                    title={tooth ? getToothLabel(tooth.status) : ""}
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Image src="/icons/windows11-filled/tooth.png" alt="Тіс" width={14} height={14} className="object-contain" />
                      <span className="text-[10px] leading-none">{id}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Lower Right */}
            <div className="flex gap-1">
              {[41, 42, 43, 44, 45, 46, 47, 48].map((id) => {
                const tooth = teeth.find((t) => t.id === id);
                return (
                  <button
                    key={id}
                    onClick={() => !readOnly && onToothClick(id)}
                    disabled={readOnly}
                    className={`h-12 w-12 rounded border-2 p-1 text-xs font-bold transition ${
                      tooth ? getToothColor(tooth.status) : "bg-white border-slate-300"
                    } ${!readOnly && "hover:shadow-md"} disabled:cursor-default`}
                    title={tooth ? getToothLabel(tooth.status) : ""}
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Image src="/icons/windows11-filled/tooth.png" alt="Тіс" width={14} height={14} className="object-contain" />
                      <span className="text-[10px] leading-none">{id}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {readOnly
          ? "Визуалды түрде емдеу жоспарын көру"
          : "Тіс нөмеріне басып емдеу түрін таңдаңыз"}
      </p>
    </div>
  );
}
