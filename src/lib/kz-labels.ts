const appointmentStatusLabels: Record<string, string> = {
  PENDING: "⏳ Күтілуде",
  CONFIRMED: "✅ Расталды",
  CANCELLED: "❌ Бас тартылды",
  COMPLETED: "✔️ Аяқталды",
};

const treatmentStatusLabels: Record<string, string> = {
  ACTIVE: "⏳ Белсенді",
  PAUSED: "⏸️ Тоқтатылды",
  COMPLETED: "✔️ Аяқталды",
};

const appointmentTypeLabels: Record<string, string> = {
  CONSULTATION: "Консультация",
  CHECKUP: "Тексеру",
  TREATMENT: "Емдеу",
  EMERGENCY: "Шұғыл қабылдау",
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "Қолма-қол",
  CARD: "Картамен",
  TRANSFER: "Банктік аударым",
};

export function getAppointmentStatusLabel(status: string): string {
  return appointmentStatusLabels[status] ?? status;
}

export function getTreatmentStatusLabel(status: string): string {
  return treatmentStatusLabels[status] ?? status;
}

export function getAppointmentTypeLabel(type: string): string {
  return appointmentTypeLabels[type] ?? type;
}

export function getPaymentMethodLabel(method: string): string {
  return paymentMethodLabels[method] ?? method;
}