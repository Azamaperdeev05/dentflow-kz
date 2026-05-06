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

export const securityActionLabels: Record<string, string> = {
  LOGIN_SUCCESS: "Сәтті кіру",
  LOGIN_FAILED: "Кіру сәтсіз",
  LOGOUT: "Жүйеден шығу",
  ADMIN_ACCESS_REQUIRED: "Админ рұқсаты талап етілді",
  ADMIN_2FA_REQUIRED: "Админ 2FA талап етілді",
  ADMIN_DOCTOR_APPROVED: "Дәрігер бекітілді",
  ADMIN_DOCTOR_REJECTED: "Дәрігер қабылданбады",
  DOCTOR_ACCESS_REQUIRED: "Дәрігер рұқсаты талап етілді",
  PATIENT_ACCESS_REQUIRED: "Пациент рұқсаты талап етілді",
  PASSWORD_RESET_REQUEST: "Құпиясөзді қалпына келтіру сұранысы",
  PASSWORD_RESET_CONFIRM: "Құпиясөз жаңартылды",
  TWO_FACTOR_RECOVERY_REQUESTED: "2FA қалпына келтіру сұралды",
  TWO_FACTOR_RECOVERY_COMPLETED: "2FA қалпына келтірілді",
  TWO_FACTOR_SETUP: "2FA орнатылды",
  TWO_FACTOR_DISABLED: "2FA өшірілді",
  CHAT_VIEW: "Чатты қарау",
  CHAT_SEND: "Хабарлама жіберу",
  CHAT_VIEW_DENIED: "Чатқа рұқсат жоқ",
  CHAT_SEND_DENIED: "Хабарлама жіберуге рұқсат жоқ",
  DOCTOR_APPROVED: "Дәрігер бекітілді",
  DOCTOR_REJECTED: "Дәрігер қабылданбады",
};

export function getSecurityActionLabel(action: string): string {
  return securityActionLabels[action] ?? action;
}

const doctorApprovalStatusLabels: Record<string, string> = {
  PENDING: "⏳ Бекіту күтіліп тұр",
  APPROVED: "✅ Бекітілді",
  REJECTED: "❌ Қабылданбады",
};

export function getDoctorApprovalStatusLabel(status: string | null): string {
  if (!status) return "✅ Бекітілді";
  return doctorApprovalStatusLabels[status] ?? status;
}