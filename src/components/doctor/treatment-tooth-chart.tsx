"use client";

import { useState } from "react";
import { ToothFormula } from "@/components/shared/tooth-formula";

type ToothStatus = "HEALTHY" | "CAVITY" | "FILLING" | "CROWN" | "EXTRACTION" | "IMPLANT";

type ToothData = {
  id: number;
  status: ToothStatus;
  procedure?: string;
  cost?: number;
};

type Props = {
  treatmentProcedures?: string;
};

export function TreatmentToothChart({ treatmentProcedures }: Props) {
  const [teeth, setTeeth] = useState<ToothData[]>(() => {
    const allTeeth: ToothData[] = [];
    for (let i = 11; i <= 18; i++) allTeeth.push({ id: i, status: "HEALTHY" });
    for (let i = 21; i <= 28; i++) allTeeth.push({ id: i, status: "HEALTHY" });
    for (let i = 31; i <= 38; i++) allTeeth.push({ id: i, status: "HEALTHY" });
    for (let i = 41; i <= 48; i++) allTeeth.push({ id: i, status: "HEALTHY" });

    if (treatmentProcedures) {
      try {
        const procedures = JSON.parse(treatmentProcedures) as Array<{ tooth: number; status: string }>;
        for (const proc of procedures) {
          const tooth = allTeeth.find((t) => t.id === proc.tooth);
          if (tooth) {
            tooth.status = (proc.status as ToothStatus) || "HEALTHY";
          }
        }
      } catch {
        // parsing failed — use defaults
      }
    }

    return allTeeth;
  });

  const handleStatusChange = (toothId: number, status: ToothStatus) => {
    setTeeth((prev) =>
      prev.map((t) => (t.id === toothId ? { ...t, status } : t))
    );
  };

  return (
    <div>
      <ToothFormula
        teeth={teeth}
        onToothStatusChange={handleStatusChange}
      />
      <input
        type="hidden"
        name="selectedTeeth"
        value={JSON.stringify(teeth)}
      />
    </div>
  );
}
