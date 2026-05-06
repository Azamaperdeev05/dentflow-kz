# 6. API анықтамалығы (API Reference)

## 6.1 Жалпы ақпарат

| Параметр | Мәні |
|----------|------|
| **Протокол** | REST |
| **Формат** | JSON |
| **Аутентификация** | NextAuth.js Session Cookie |
| **Валидация** | Zod schemas |
| **Rate Limiting** | enforceMutationGuard (20 req / 15 min) |

## 6.2 Аутентификация API

### POST /api/auth/register
Жаңа пайдаланушыны тіркеу (OTP жіберу).

| Параметр | Тип | Сипаттамасы |
|----------|-----|-------------|
| name | string | Аты-жөні |
| email | string | Email |
| password | string | Құпиясөз (8+ символ) |
| phone | string? | Телефон |
| role | "PATIENT" / "DOCTOR" | Рөл |

**Жауаптар:** `200` — OTP жіберілді, `400` — валидация қатесі, `409` — email тіркелген

### POST /api/auth/register/verify
OTP кодпен тіркелуді растау.

| Параметр | Тип | Сипаттамасы |
|----------|-----|-------------|
| email | string | Email |
| code | string | 6-цифрлы OTP код |

### POST /api/auth/forgot-password
Құпиясөзді қалпына келтіру сілтемесін жіберу.

### POST /api/auth/reset-password
Жаңа құпиясөзді орнату.

### POST /api/auth/two-factor/setup
2FA QR-код генерациялау.

### POST /api/auth/two-factor/enable
2FA-ны кодпен растап қосу.

### POST /api/auth/two-factor/disable
2FA-ны өшіру (код қажет).

## 6.3 Пациент API

### GET /api/doctors
Бекітілген дәрігерлер тізімі.

**Жауап:** `{ doctors: DoctorProfile[] }`

### GET /api/appointments
Пациенттің қабылдаулар тізімі.

### POST /api/appointments
Жаңа қабылдауға жазылу.

| Параметр | Тип | Сипаттамасы |
|----------|-----|-------------|
| doctorId | string | Дәрігер профиль ID |
| dateTime | string | ISO DateTime |
| complaint | string? | Шағым |
| type | string? | Қабылдау түрі |

### PATCH /api/appointments/[appointmentId]
Қабылдау статусын өзгерту (бас тарту, т.б.).

### POST /api/patient/profile
Пациент профилін жаңарту.

| Параметр | Тип | Сипаттамасы |
|----------|-----|-------------|
| birthDate | string? | Туған күні |
| gender | "MALE"/"FEMALE"? | Жынысы |
| region | string? | Облыс |
| address | string? | Мекенжай |
| bloodType | string? | Қан тобы |
| allergies | string[]? | Аллергия тізімі |
| notes | string? | Ескертпе |

### POST /api/patient/treatments/[treatmentId]/approve
Емдеу жоспарын бекіту (approve: true/false).

## 6.4 Дәрігер API

### GET /api/doctor/appointments
Дәрігердің қабылдаулар тізімі.

### PATCH /api/doctor/appointments/[appointmentId]
Қабылдау статусын жаңарту (COMPLETED, NO_SHOW).

### POST /api/doctor/profile
Дәрігер профилін жаңарту.

### POST /api/doctor/treatments
Емдеу жоспарын құру.

| Параметр | Тип | Сипаттамасы |
|----------|-----|-------------|
| patientId | string | Пациент профиль ID |
| appointmentId | string? | Қабылдау ID |
| diagnosis | string | Диагноз |
| procedures | string | Процедуралар |
| totalCost | number | Жалпы құн |

### POST /api/doctor/payments
Төлем тіркеу.

| Параметр | Тип | Сипаттамасы |
|----------|-----|-------------|
| treatmentId | string | Емдеу ID |
| amount | number | Сома |
| method | "CASH"/"CARD"/"TRANSFER" | Әдіс |
| note | string? | Ескертпе |

## 6.5 Коммуникация API

### GET /api/messages
Чат тізімі (собеседниктер).

### GET /api/messages/[userId]
Белгілі бір пайдаланушымен чат тарихы.

### POST /api/messages/[userId]
Хабарлама жіберу (FormData — мәтін + файл).

### GET /api/messages/unread-count
Оқылмаған хабарлама саны.

### GET /api/notifications
Хабарландырулар тізімі.

### POST /api/upload
Файл жүктеу (медициналық файл, чат қосымшасы).

## 6.6 Админ API

### GET /api/admin/doctors
Бекітуді күтетін дәрігерлер тізімі.

### POST /api/admin/doctors/[userId]/approve
Дәрігерді бекіту.

### POST /api/admin/doctors/[userId]/reject
Дәрігерді бас тарту.

### GET /api/admin/stats
Жалпы статистика (пайдаланушылар, қабылдаулар, т.б.).
