# 04. Жүйе архитектурасы

## 1. Архитектуралық стиль

DentFlow KZ көпқабатты веб-архитектурамен құрылған:

1. Presentation қабаты: Next.js App Router, React компоненттер.
2. Application/API қабаты: Route Handlers (`src/app/api/...`).
3. Domain/Service қабаты: `src/lib` (auth, session, validation, security, rbac).
4. Data қабаты: Prisma ORM және SQLite.

## 2. Негізгі компоненттер

- UI беттері: auth, patient, doctor, admin бөлімдері.
- API маршруттары: auth, appointments, treatments, payments, messages, notifications, upload.
- Auth ядросы: NextAuth credentials provider.
- Security ядросы: audit-log, security-risk, rbac.

## 3. Дерек ағыны (жалпы)

1. Клиент форма жібереді.
2. API route request-ті қабылдайды.
3. Zod схема валидация жасайды.
4. Session/role тексерісі жасалады.
5. Prisma арқылы DB операциясы орындалады.
6. Қауіпсіздік оқиғасы логқа жазылады (маңызды операциялар үшін).
7. JSON response қайтарылады.

## 4. Рөлдік бақылау архитектурасы

- Middleware URL деңгейінде рөлдерді бағыттайды.
- `requirePatient`, `requireDoctor`, `requireAdmin` серверлік тексеріс жасайды.
- RBAC утилиттері нақты бизнес-рұқсатты тексереді (мысалы, doctor-patient байланысы).

## 5. Модульаралық байланыс

- `src/lib/session.ts` API және page-де қайта қолданылады.
- `src/lib/validations.ts` барлық формалар мен endpoint-терге ортақ.
- `src/lib/audit-log.ts` қауіпсіздік оқиғаларын орталықтандырады.

## 6. Архитектура артықшылықтары

- Код модульдігі жоғары.
- Қауіпсіздік логикасы оқшауланған.
- Жаңа рөлдер немесе модульдер қосуға ыңғайлы.

## 7. Шектеулер

- SQLite concurrent write сценарийлерінде lock бере алады.
- Үлкен жүктемеде PostgreSQL сияқты серверлік СУБД тиімдірек.
