"use client";

import { useState } from "react";
import { ToothFormula } from "@/components/shared/tooth-formula";

type ToothData = {
  id: number;
  status: "HEALTHY" | "CAVITY" | "FILLING" | "CROWN" | "EXTRACTION" | "IMPLANT";
  procedure?: string;
  cost?: number;
};

type Props = {
  treatmentProcedures?: string;
};

export function TreatmentToothChart({ treatmentProcedures }: Props) {
  const [teeth, setTeeth] = useState<ToothData[]>(() => {
    // Initialize all 32 teeth as healthy
    const allTeeth: ToothData[] = [];
    // Upper right
    for (let i = 11; i <= 18; i++) allTeeth.push({ id: i, status: "HEALTHY" });
    // Upper left
    for (let i = 21; i <= 28; i++) allTeeth.push({ id: i, status: "HEALTHY" });
    // Lower left
    for (let i = 31; i <= 38; i++) allTeeth.push({ id: i, status: "HEALTHY" });
    // Lower right
    for (let i = 41; i <= 48; i++) allTeeth.push({ id: i, status: "HEALTHY" });

    // Parse existing procedures if available
    if (treatmentProcedures) {
      try {
        const procedures = JSON.parse(treatmentProcedures) as Array<{ tooth: number; status: string }>;
        for (const proc of procedures) {
          const tooth = allTeeth.find((t) => t.id === proc.tooth);
          if (tooth) {
            tooth.status = (proc.status as ToothData["status"]) || "HEALTHY";
          }
        }
      } catch {
        // If parsing fails, use default
      }
    }

    return allTeeth;
  });

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ToothData["status"]>("CAVITY");

  const handleToothClick = (toothId: number) => {
    setSelectedTooth(toothId);
  };

  const updateToothStatus = (status: ToothData["status"]) => {
    if (selectedTooth) {
      setTeeth((prev) =>
        prev.map((t) => (t.id === selectedTooth ? { ...t, status } : t))
      );
      setSelectedStatus(status);
    }
  };

  const currentTooth = selectedTooth ? teeth.find((t) => t.id === selectedTooth) : null;

  return (
    <div className="space-y-4">
      <ToothFormula teeth={teeth} onToothClick={handleToothClick} />

      {selectedTooth && (
        <div className="rounded-lg bg-slate-50 p-4">
          <h4 className="font-semibold text-slate-900">Тіс #{selectedTooth}</h4>
          <p className="mt-1 text-sm text-slate-600">Емдеу түрін таңдаңыз:</p>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
            {(
              [
                "HEALTHY",
                "CAVITY",
                "FILLING",
                "CROWN",
                "EXTRACTION",
                "IMPLANT",
              ] as const
            ).map((status) => (
              <button
                key={status}
                onClick={() => updateToothStatus(status)}
                className={`rounded px-3 py-2 text-sm font-medium transition ${
                  currentTooth?.status === status
                    ? "bg-cyan-600 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {status === "HEALTHY" && "Сау"}
                {status === "CAVITY" && "Кариес"}
                {status === "FILLING" && "Пломба"}
                {status === "CROWN" && "Тәж"}
                {status === "EXTRACTION" && "Алу"}
                {status === "IMPLANT" && "Имплант"}
              </button>
            ))}
          </div>
          <input
            type="hidden"
            name="selectedTeeth"
            value={JSON.stringify(teeth)}
          />
        </div>
      )}

      <div className="text-sm text-slate-500">
        <p>Таңдалған: {teeth.filter((t) => t.status !== "HEALTHY").length} / 32 тіс</p>
      </div>
    </div>
  );
}
