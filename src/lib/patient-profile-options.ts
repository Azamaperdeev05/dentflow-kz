export const kazakhstanRegions = [
  "Абай облысы",
  "Ақмола облысы",
  "Ақтөбе облысы",
  "Алматы облысы",
  "Атырау облысы",
  "Батыс Қазақстан облысы",
  "Жамбыл облысы",
  "Жетісу облысы",
  "Қарағанды облысы",
  "Қостанай облысы",
  "Қызылорда облысы",
  "Маңғыстау облысы",
  "Павлодар облысы",
  "Солтүстік Қазақстан облысы",
  "Түркістан облысы",
  "Ұлытау облысы",
  "Шығыс Қазақстан облысы",
  "Астана қаласы",
  "Алматы қаласы",
  "Шымкент қаласы",
] as const;

export const genderOptions = [
  { value: "MALE", label: "Ұл" },
  { value: "FEMALE", label: "Қыз" },
] as const;

export const bloodTypeOptions = ["I+", "I-", "II+", "II-", "III+", "III-", "IV+", "IV-"] as const;

export const allergyOptions = [
  "Дәріге аллергия",
  "Тағамға аллергия",
  "Тозаңға аллергия",
  "Латекске аллергия",
  "Жануар жүніне аллергия",
] as const;

export function parseStringArray(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item)).filter(Boolean);
    }
  } catch {
    // ignore parse fallback below
  }

  return value
    .split(/[;,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
