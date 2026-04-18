# 06. API анықтамалығы

## 1. Жалпы ережелер

- База URL: `/api/...`
- Негізгі формат: JSON request/response
- Аутентификация: NextAuth session
- Валидация: Zod

## 2. Auth API

- POST `/api/auth/register` — тіркелу
- POST `/api/auth/register/verify` — email кодын растау
- POST `/api/auth/forgot-password` — код сұрау
- POST `/api/auth/reset-password` — құпиясөзді жаңарту
- POST `/api/auth/login/two-factor-status` — login precheck/2FA күйін тексеру
- POST `/api/auth/login-otp/request` — OTP сұрау
- POST `/api/auth/login-otp/verify` — OTP растау
- GET `/api/auth/two-factor/status` — 2FA статус
- POST `/api/auth/two-factor/setup` — 2FA setup
- POST `/api/auth/two-factor/enable` — 2FA қосу
- POST `/api/auth/two-factor/disable` — 2FA өшіру

## 3. Patient/Doctor API

- GET `/api/doctors` — дәрігерлер тізімі/фильтр
- GET `/api/appointments` — пациенттің қабылдаулары
- POST `/api/appointments` — қабылдауға жазылу
- PATCH `/api/appointments/[appointmentId]` — пациент қабылдауды өзгерту
- POST `/api/doctor/appointments` — дәрігерге қатысты операция
- PATCH `/api/doctor/appointments/[appointmentId]` — дәрігер статус өзгертеді
- POST `/api/doctor/treatments` — емдеу жоспары
- POST `/api/doctor/payments` — төлем енгізу
- POST `/api/patient/treatments/[treatmentId]/approve` — емді бекіту

## 4. Communication API

- GET `/api/messages` — чат контакт тізімі
- GET `/api/messages/[userId]` — диалог хабарламалары
- POST `/api/messages/[userId]` — хабарлама жіберу
- GET `/api/notifications` — хабарландыру алу
- POST `/api/notifications` — хабарландыру күйін өзгерту
- POST `/api/upload` — медициналық файл жүктеу

## 5. Қателерді өңдеу

Күтілетін кодтар:

- 200 OK — сәтті
- 400 Bad Request — валидация/логика қатесі
- 401 Unauthorized — сессия жоқ
- 403 Forbidden — рөл/рұқсат жетіспейді
- 404 Not Found — ресурс табылмады
- 429 Too Many Requests — rate limit
- 500 Internal Server Error — серверлік ішкі қате

## 6. API мысал (register)

Request body өрістері:

- name
- email
- phone (optional)
- password
- confirmPassword
- role (PATIENT/DOCTOR)
- specializations (DOCTOR үшін массив)
- experience, licenseNumber (optional)

Response:

- success
- requiresVerification
- message
