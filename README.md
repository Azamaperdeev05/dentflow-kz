# 🦷 DentFlow KZ

**DentFlow KZ** — стоматологиялық клиниканың жұмысын толық цифрландыруға арналған веб-платформа. Жүйе пациент, дәрігер және админ рөлдерін бір ортаға біріктіріп, қабылдауға жазылу, емдеу жоспары, медициналық файлдар, шифрланған чат, 2FA қауіпсіздік және қаржылық есеп сияқты негізгі клиникалық процестерді басқарады.

## 📋 Жоба туралы

| Параметр | Мәні |
|----------|------|
| **Дипломдық тақырып** | Стоматологиялық клиниканың веб-платформасын жобалау және әзірлеу |
| **Мақсаты** | Клиникадағы пациенттік және дәрігерлік процестерді бір жүйеге көшіру |
| **Интерфейс тілі** | Қазақ тілі |
| **Негізгі қағида** | Рөлге сай рұқсат, валидация, аудит және қауіпсіздік |
| **Статус** | ✅ Толық жұмыс істейтін MVP |

## 🚀 Негізгі мүмкіндіктер

### 👤 Пациент панелі
- Email арқылы тіркелу және email верификациясы (OTP)
- Құпиясөзді қалпына келтіру (email арқылы)
- 2FA (TOTP) қосу/өшіру/қалпына келтіру
- Дәрігерлерді іздеу, сүзу және бос слоттарды көру
- Күнтізбе арқылы қабылдауға жазылу, өзгерту, бас тарту
- Медициналық тарихын және емдеу жоспарларын көру
- Емдеу жоспарын бекіту немесе қабылдамау
- Медициналық файлдарды (рентген, анализ) жүктеу
- **Профильді өзі өңдеу** (облыс, жынысы, қан тобы, аллергия, мекенжай)
- Дәрігермен шифрланған чат (мәтін + файл жіберу)
- Push хабарландырулар

### 🩺 Дәрігер панелі
- Бүгінгі/апталық қабылдаулар дашборды
- Күнтізбелі кестемен қабылдауларды басқару
- Пациенттер тізімін көру
- Емдеу жоспарын құру (кезеңдермен)
- Төлем енгізу (қолма-қол, карта, аударым)
- Қаржылық есеп (сүзгілермен, әдіс бойынша)
- **Профильді өзі өңдеу** (мамандық, лицензия, кесте, тәжірибе)
- Пациентпен шифрланған чат
- Тіс түрлері анатомиясы (FDI)

### 🔒 Админ панелі
- Дәрігерлерді бекіту / бас тарту
- Қауіпсіздік журналы (Security Audit Log)
- Күдікті әрекеттерді бақылау
- 2FA міндетті қосылуы

## 🛠 Технологиялық стек

| Категория | Технология |
|-----------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Routing** | App Router (Route Groups) |
| **UI/CSS** | Tailwind CSS, shadcn/ui elements |
| **Validation** | Zod |
| **Auth** | NextAuth.js v5 (Credentials + TOTP 2FA) |
| **ORM** | Prisma |
| **Database** | SQLite (dev), PostgreSQL-ready |
| **Email** | Nodemailer + Gmail SMTP |
| **Encryption** | AES-256-CBC (чат шифрлау) |
| **Real-time** | SSE (Server-Sent Events) |
| **Icons** | Windows 11 Fluent Design System |
| **Tests** | Vitest |

## 📁 Жоба құрылымы

```
dentflow-kz/
├── prisma/                    # Prisma схемасы және миграциялар
│   ├── schema.prisma          # Деректер базасының моделі (16 кесте)
│   └── migrations/            # SQL миграциялар
├── src/
│   ├── app/                   # Next.js App Router беттері
│   │   ├── (auth)/            # Аутентификация беттері (login, register, forgot-password)
│   │   ├── (patient)/         # Пациент панелі (dashboard, appointments, doctors, chat)
│   │   ├── (doctor)/          # Дәрігер панелі (dashboard, schedule, treatment, finance)
│   │   ├── (admin)/           # Админ панелі (dashboard, doctors, security)
│   │   └── api/               # API маршруттары (30+ endpoint)
│   ├── components/            # React компоненттер
│   │   ├── patient/           # Пациент компоненттері (11 файл)
│   │   ├── doctor/            # Дәрігер компоненттері (10 файл)
│   │   ├── admin/             # Админ компоненттері
│   │   └── shared/            # Ортақ компоненттер (2FA, чат, хабарландыру)
│   └── lib/                   # Бизнес-логика және утилиттер
│       ├── auth.ts            # NextAuth конфигурациясы
│       ├── session.ts         # Сессия және рөлді тексеру
│       ├── rbac.ts            # Рөлге негізделген қолжетімділік
│       ├── sanitize.ts        # XSS/SQL инъекция қорғанысы
│       ├── rate-limit.ts      # Rate limiting
│       ├── mutation-guard.ts  # CSRF + Rate limit біріктірілген күзет
│       ├── audit-log.ts       # Қауіпсіздік аудит журналы
│       ├── secret-crypto.ts   # AES-256-CBC шифрлау/дешифрлау
│       ├── validations.ts     # Zod валидация схемалары
│       ├── scheduling.ts      # Күнтізбе және слот логикасы
│       └── email.ts           # Email жіберу (Nodemailer)
├── public/icons/              # Windows 11 стиліндегі SVG/PNG белгішелер
├── docs/                      # Дипломдық құжаттама (11 бөлім)
└── __tests__/                 # Unit/integration тесттер
```

## 🏗 Архитектура

```
┌─────────────────────────────────────────────┐
│            Presentation Layer               │
│   (src/app pages + src/components)          │
├─────────────────────────────────────────────┤
│            Application / API Layer          │
│   (src/app/api — 30+ REST endpoints)        │
├─────────────────────────────────────────────┤
│            Domain / Logic Layer             │
│   (src/lib — auth, rbac, validation, etc.)  │
├─────────────────────────────────────────────┤
│            Data Access Layer                │
│   (Prisma ORM + SQLite Database)            │
└─────────────────────────────────────────────┘
```

## 🔐 Қауіпсіздік жүйесі

| Қабат | Механизм | Сипаттамасы |
|-------|----------|-------------|
| **Auth** | NextAuth.js + bcryptjs | Credentials аутентификация, құпиясөз хэштеу |
| **2FA** | TOTP (otpauth) | Google Authenticator, QR-код, backup codes |
| **RBAC** | requirePatient/Doctor/Admin | Рөлге негізделген қолжетімділік |
| **Rate Limit** | enforceMutationGuard | Brute-force шабуылдардан қорғау |
| **Validation** | Zod schemas | Input sanitization, тип тексерісі |
| **XSS** | sanitize.ts | HTML тегтерін жою, script блоктау |
| **Encryption** | AES-256-CBC | Чат хабарламаларын шифрлау |
| **Audit** | SecurityAuditLog | Барлық маңызды әрекеттерді журналдау |
| **Risk** | LoginRiskSignal | IP/UserAgent/Fingerprint тексерісі |

## 🗄 Деректер базасы (16 кесте)

| Кесте | Сипаттамасы |
|-------|-------------|
| `User` | Жалпы қолданушы (name, email, password, role, 2FA) |
| `PatientProfile` | Пациент профилі (birthDate, gender, bloodType, allergies) |
| `DoctorProfile` | Дәрігер профилі (specializations, workDays, slotDuration) |
| `Appointment` | Қабылдау жазбасы (dateTime, status, complaint, type) |
| `AppointmentSlot` | Слот кестесі |
| `Treatment` | Емдеу жоспары (diagnosis, procedures, totalCost, status) |
| `Payment` | Төлемдер (amount, method, note) |
| `Message` | Чат хабарламалары (шифрланған, файлдармен) |
| `Notification` | Хабарландырулар (SSE push) |
| `MedicalFile` | Медициналық файлдар (рентген, анализ) |
| `SecurityAuditLog` | Қауіпсіздік журналы |
| `LoginRiskSignal` | Логин тәуекел сигналы |
| `LoginOtp` | Email OTP коды |
| `PasswordReset` | Құпиясөз қалпына келтіру токені |
| `PendingRegistration` | Тіркелу растау коды |
| `RateLimitAttempt` | Rate limit бақылауы |

## 🌐 API маршруттары (30+)

### Аутентификация
| Әдіс | Маршрут | Сипаттамасы |
|-------|---------|-------------|
| POST | `/api/auth/register` | Тіркелу (OTP жіберу) |
| POST | `/api/auth/register/verify` | Тіркелуді растау |
| POST | `/api/auth/forgot-password` | Құпиясөзді қалпына келтіру сұрауы |
| POST | `/api/auth/reset-password` | Жаңа құпиясөз орнату |
| POST | `/api/auth/two-factor/setup` | 2FA QR-код генерациясы |
| POST | `/api/auth/two-factor/enable` | 2FA қосу |
| POST | `/api/auth/two-factor/disable` | 2FA өшіру |
| POST | `/api/auth/two-factor/recovery-request` | 2FA қалпына келтіру |

### Пациент / Дәрігер
| Әдіс | Маршрут | Сипаттамасы |
|-------|---------|-------------|
| GET | `/api/doctors` | Дәрігерлер тізімі |
| GET/POST | `/api/appointments` | Қабылдаулар (тізім / жаңа жазба) |
| PATCH | `/api/appointments/[id]` | Қабылдау статусын өзгерту |
| POST | `/api/patient/profile` | Пациент профилін жаңарту |
| POST | `/api/doctor/profile` | Дәрігер профилін жаңарту |
| POST | `/api/doctor/treatments` | Емдеу жоспарын құру |
| POST | `/api/doctor/payments` | Төлем тіркеу |

### Коммуникация
| Әдіс | Маршрут | Сипаттамасы |
|-------|---------|-------------|
| GET/POST | `/api/messages/[userId]` | Чат хабарламалары (шифрланған) |
| GET | `/api/messages/unread-count` | Оқылмаған хабарлама саны |
| GET/POST | `/api/notifications` | Хабарландырулар |
| POST | `/api/upload` | Файл жүктеу |

## ⚡ Жылдам іске қосу

```bash
# 1. Тәуелділіктерді орнату
npm install

# 2. .env файлын баптау
cp .env.example .env
# DATABASE_URL, NEXTAUTH_SECRET, EMAIL_USER, EMAIL_PASS толтырыңыз

# 3. Деректер базасын дайындау
npm run db:generate
npm run db:migrate

# 4. Дем-деректерді жүктеу (seed)
npm run db:seed

# 5. Development сервер
npm run dev
# → http://localhost:3000
```

## 📜 Скрипттер

| Команда | Сипаттамасы |
|---------|-------------|
| `npm run dev` | Development сервер |
| `npm run build` | Production build |
| `npm run start` | Production режим |
| `npm run test` | Vitest тесттері |
| `npm run db:generate` | Prisma client генерациясы |
| `npm run db:migrate` | Prisma миграция |
| `npm run db:studio` | Prisma Studio (визуал DB) |
| `npm run admin:create` | Админ жасау скрипті |

## 📚 Құжаттама

Дипломдық жобаға қатысты толық құжаттама `docs/` папкасында:

| № | Файл | Тақырып |
|---|------|---------|
| 1 | `docs/01-diploma-passport.md` | Дипломдық жұмыс паспорты |
| 2 | `docs/02-system-concept.md` | Жүйе тұжырымдамасы |
| 3 | `docs/03-requirements-and-use-cases.md` | Талаптар мен пайдалану сценарийлері |
| 4 | `docs/04-architecture.md` | Архитектура және технологиялық шешімдер |
| 5 | `docs/05-database-design.md` | Деректер базасын жобалау |
| 6 | `docs/06-api-reference.md` | API анықтамалығы |
| 7 | `docs/07-security-model.md` | Қауіпсіздік моделі |
| 8 | `docs/08-testing-report.md` | Тестілеу есебі |
| 9 | `docs/09-user-guide.md` | Пайдаланушы нұсқаулығы |
| 10 | `docs/10-deployment.md` | Орналастыру нұсқаулығы |
| 11 | `docs/11-conclusion.md` | Қорытынды мен болашақ жоспар |

## 📝 Лицензия

MIT © 2026 DentFlow KZ