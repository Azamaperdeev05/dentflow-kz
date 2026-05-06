# DentFlow KZ — AI нұсқаулық

## Жоба сипаттамасы
DentFlow KZ — стоматологиялық клиниканың веб-платформасы. Next.js 14 + TypeScript + Prisma + SQLite.

## Негізгі командалар
```bash
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build
npm run test         # Vitest тесттері
npm run db:generate  # Prisma client
npm run db:migrate   # Prisma migrate
npm run db:studio    # Prisma Studio
```

## Жоба құрылымы
- `src/app/(auth)/` — Login, Register, Forgot Password
- `src/app/(patient)/` — Пациент панелі
- `src/app/(doctor)/` — Дәрігер панелі
- `src/app/(admin)/` — Админ панелі
- `src/app/api/` — API маршруттары (30+)
- `src/components/` — React компоненттер (patient/, doctor/, admin/, shared/)
- `src/lib/` — Бизнес-логика (auth, session, rbac, crypto, validation)
- `prisma/schema.prisma` — Деректер базасы (16 кесте)

## Маңызды файлдар
- `src/lib/auth.ts` — NextAuth конфигурациясы
- `src/lib/session.ts` — requirePatient/Doctor/Admin guard-тар
- `src/lib/mutation-guard.ts` — CSRF + Rate limit
- `src/lib/secret-crypto.ts` — AES-256-CBC шифрлау
- `src/lib/audit-log.ts` — Security audit logging
- `src/lib/sanitize.ts` — XSS қорғанысы

## Стиль ережелері
- Интерфейс тілі: қазақ тілі
- Қате хабарламалар: қазақ тілінде
- UI: Tailwind CSS + Windows 11 Fluent иконографиясы
- Компоненттер: shadcn/ui стилистикасы

## Деректер базасы
- ORM: Prisma
- DB: SQLite (dev.db)
- 16 кесте: User, PatientProfile, DoctorProfile, Appointment, Treatment, Payment, Message, Notification, MedicalFile, SecurityAuditLog, LoginRiskSignal, LoginOtp, PasswordReset, PendingRegistration, AppointmentSlot, RateLimitAttempt

## Қауіпсіздік
- Auth: NextAuth.js + bcryptjs
- 2FA: TOTP (otpauth)
- RBAC: requirePatient(), requireDoctor(), requireAdmin()
- Rate limit: enforceMutationGuard()
- Encryption: AES-256-CBC (чат)
- Audit: SecurityAuditLog

## Тест деректері
- Пациенттер: 10 адам (Qazaq123!)
- Дәрігерлер: 5 адам (Qazaq123!)
- Админ: admin@dentflow.kz (Admin123!)
