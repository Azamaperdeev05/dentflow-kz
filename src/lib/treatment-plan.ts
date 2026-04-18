export type TreatmentStage = {
  id: string;
  title: string;
  cost: number;
};

export type TreatmentMeta = {
  approvedByPatient?: boolean;
  approvedAt?: string;
};

function safeParse(value: string | null | undefined): unknown {
  if (!value?.trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function parseTreatmentStages(procedures: string | null | undefined): TreatmentStage[] {
  const parsed = safeParse(procedures);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item, index) => {
      const obj = item as Record<string, unknown>;
      const title = typeof obj.title === "string" ? obj.title.trim() : "";
      const costRaw = typeof obj.cost === "number" ? obj.cost : Number(obj.cost ?? 0);
      const cost = Number.isFinite(costRaw) && costRaw >= 0 ? costRaw : 0;
      if (!title) {
        return null;
      }

      return {
        id: typeof obj.id === "string" && obj.id ? obj.id : `stage_${index + 1}`,
        title,
        cost,
      } satisfies TreatmentStage;
    })
    .filter((item): item is TreatmentStage => Boolean(item));
}

export function stringifyTreatmentStages(stages: TreatmentStage[]): string {
  return JSON.stringify(stages);
}

export function sumStageCosts(stages: TreatmentStage[]): number {
  return stages.reduce((sum, stage) => sum + stage.cost, 0);
}

export function parseTreatmentMeta(notes: string | null | undefined): TreatmentMeta {
  const parsed = safeParse(notes);
  if (!parsed || typeof parsed !== "object") {
    return {};
  }

  const obj = parsed as Record<string, unknown>;
  return {
    approvedByPatient: Boolean(obj.approvedByPatient),
    approvedAt: typeof obj.approvedAt === "string" ? obj.approvedAt : undefined,
  };
}

export function stringifyTreatmentMeta(meta: TreatmentMeta): string {
  return JSON.stringify(meta);
}
