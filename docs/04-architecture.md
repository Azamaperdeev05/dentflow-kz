# 4. Архитектура және технологиялық шешімдер

## 4.1 Жалпы архитектура

DentFlow KZ — көпқабатты (N-tier) клиент-сервер архитектурасымен құрылған. Next.js App Router SSR/CSR гибридті рендеринг ұсынады.

```
┌─────────────────────────────────────────────────┐
│              Client (Browser)                    │
│  React 18 + TypeScript + Tailwind CSS           │
├─────────────────────────────────────────────────┤
│         Next.js 14 App Router                    │
│   ┌─────────────┐  ┌──────────────────┐         │
│   │  Pages/SSR   │  │  API Routes      │         │
│   │  (patient)   │  │  /api/auth/*     │         │
│   │  (doctor)    │  │  /api/patient/*  │         │
│   │  (admin)     │  │  /api/doctor/*   │         │
│   │  (auth)      │  │  /api/admin/*    │         │
│   └─────────────┘  └──────────────────┘         │
├─────────────────────────────────────────────────┤
│              Business Logic Layer                │
│   src/lib/ (auth, rbac, validation, crypto)     │
├─────────────────────────────────────────────────┤
│              Data Access Layer                   │
│   Prisma ORM → SQLite (dev.db)                  │
└─────────────────────────────────────────────────┘
```

## 4.2 Route Group архитектурасы

Next.js App Router route groups арқылы рөлдерді бөлу:

| Route Group | Мақсаты | Layout |
|-------------|---------|--------|
| `(auth)` | Login, Register, Forgot Password | Минималистік |
| `(patient)` | Пациент панелі | PatientHeader + PatientNav |
| `(doctor)` | Дәрігер панелі | DoctorHeader + DoctorNav |
| `(admin)` | Админ панелі | AdminHeader + AdminNav |

## 4.3 Технология таңдау негіздемесі

| Технология | Неге таңдалды |
|------------|---------------|
| **Next.js 14** | SSR/SSG, API Routes, App Router — full-stack мүмкіндік |
| **TypeScript** | Типтік қауіпсіздік, IDE қолдауы, қате азайту |
| **Prisma** | Type-safe ORM, автоматты миграция, studio |
| **SQLite** | Нөлдік конфигурация, demo/dev үшін жеткілікті |
| **NextAuth.js** | Credentials + 2FA оңай интеграция |
| **Zod** | Runtime валидация, TypeScript типтерімен интеграция |
| **Tailwind CSS** | Utility-first, жылдам прототиптеу |
| **AES-256-CBC** | Медициналық деректер шифрлау стандарты |
| **Nodemailer** | Gmail SMTP арқылы OTP/notification жіберу |

## 4.4 Компонент архитектурасы

```
src/components/
├── patient/                    # Пациент компоненттері
│   ├── patient-nav.tsx         # Навигация (sidebar)
│   ├── patient-header.tsx      # Жоғарғы хедер
│   ├── patient-profile-editor.tsx # Профиль өңдеу (көру/өзгерту toggle)
│   ├── appointment-calendar.tsx   # Күнтізбелі жазылу
│   ├── doctor-list.tsx         # Дәрігерлер тізімі
│   └── medical-history-list.tsx   # Медициналық тарих
├── doctor/
│   ├── doctor-nav.tsx          # Дәрігер навигациясы
│   ├── doctor-profile-editor.tsx  # Профиль өңдеу
│   ├── treatment-form.tsx      # Емдеу жоспар формасы
│   ├── payment-form.tsx        # Төлем формасы
│   └── finance-dashboard.tsx   # Қаржылық дашборд
├── admin/
│   ├── admin-nav.tsx           # Админ навигациясы
│   └── security-dashboard.tsx  # Қауіпсіздік панелі
└── shared/
    ├── chat-box.tsx            # Шифрланған чат
    ├── two-factor-settings.tsx # 2FA баптау
    └── notification-bell.tsx   # Хабарландыру қоңырауы
```

## 4.5 Деректер ағымы (Data Flow)

```
1. Пайдаланушы → UI форма толтырады
2. Client → Zod валидация (client-side)
3. Client → API Route (POST/PATCH/GET)
4. Server → Session тексерісі (requirePatient/Doctor/Admin)
5. Server → enforceMutationGuard (CSRF + Rate limit)
6. Server → Zod валидация (server-side)
7. Server → Prisma → SQLite (CRUD)
8. Server → Audit Log жазу (маңызды әрекеттер)
9. Server → JSON Response қайтару
10. Client → UI жаңарту (router.refresh)
```

## 4.6 Қауіпсіздік архитектурасы

```
Request Flow:
  ┌─────────┐    ┌──────────┐    ┌───────────┐    ┌────────┐
  │ Client   │ →  │ Middleware │ →  │ Session    │ →  │ RBAC   │
  │          │    │ (routing) │    │ Guard      │    │ Check  │
  └─────────┘    └──────────┘    └───────────┘    └────────┘
                                                       │
                                       ┌───────────────┤
                                       ↓               ↓
                                 ┌──────────┐   ┌────────────┐
                                 │ Zod      │   │ Mutation   │
                                 │ Validate │   │ Guard      │
                                 └──────────┘   │ (CSRF+RL)  │
                                       │        └────────────┘
                                       ↓
                                 ┌──────────┐
                                 │ Prisma   │
                                 │ DB Query │
                                 └──────────┘
                                       │
                                       ↓
                                 ┌──────────┐
                                 │ Audit    │
                                 │ Log      │
                                 └──────────┘
```
