# DentFlow KZ

## Дипломдық жоба туралы

- Дипломдық тақырып: Стоматологиялық клиниканың веб-платформасын жобалау және әзірлеу
- Студент: Алтынбек Назгүл
- Топ: СИБ 22-2

DentFlow KZ — стоматологиялық клиника процестерін цифрландыруға арналған веб-платформа. Жүйе пациент, дәрігер және админ рөлдері үшін бір ортада:

- онлайн тіркелу және авторизация;
- қабылдауға жазылу және кесте басқару;
- емдеу жоспарын құру және төлем есебі;
- чат және хабарландыру;
- қауіпсіздік аудиті және тәуекел мониторингі;

функцияларын қамтамасыз етеді.

## Технологиялық стек

- Frontend: Next.js 14 (App Router), React 18, TypeScript
- UI: Tailwind CSS, React Hook Form, Zod
- Backend: Next.js Route Handlers (API)
- Auth: NextAuth (Credentials + 2FA)
- ORM/DB: Prisma + SQLite
- Тест: Vitest

## Жылдам іске қосу

1. Тәуелділіктерді орнату:

	npm install

2. Environment айнымалыларын баптау:

	.env файлына кемінде:

	- DATABASE_URL
	- NEXTAUTH_URL
	- NEXTAUTH_SECRET
	- EMAIL_USER, EMAIL_PASS (email растау/OTP үшін)

3. Prisma клиенті және миграция:

	npm run db:generate
	npm run db:migrate

4. Жобаны іске қосу:

	npm run dev

5. Production build тексеру:

	npm run build

## Скрипттер

- npm run dev — development сервер
- npm run build — production build
- npm run start — production режимде іске қосу
- npm run test — автоматтандырылған тесттер
- npm run db:generate — Prisma client генерациясы
- npm run db:migrate — Prisma migration
- npm run db:studio — Prisma Studio
- npm run admin:create — админ қолданушы дайындау

## Модульдер

- Аутентификация және авторизация
- Пациент панелі
- Дәрігер панелі
- Админ қауіпсіздік панелі
- API қабаты
- Деректер базасы
- Қауіпсіздік және аудит логтары

## Жоба құрылымы

- src/app — маршруттар мен UI беттері
- src/app/api — серверлік API endpoint-тер
- src/lib — бизнес логика, утилиттер, auth, қауіпсіздік
- src/components — интерфейс компоненттері
- prisma — schema және migration
- __tests__ — тесттер
- docs — дипломдық және техникалық құжаттама

## Құжаттар индексі

Төмендегі файлдар дипломдық жұмыс пен қорғауға қажет толық материал ретінде дайындалған:

1. docs/01-diploma-passport.md
2. docs/02-system-concept.md
3. docs/03-requirements-and-use-cases.md
4. docs/04-architecture.md
5. docs/05-database-design.md
6. docs/06-api-reference.md
7. docs/07-business-logic.md
8. docs/08-security-and-risk.md
9. docs/09-testing-and-quality.md
10. docs/10-deployment-and-operations.md
11. docs/11-thesis-writing-materials.md

## Ескерту

Бұл репозиторийде практикалық жүзеге асыру коды мен дипломдық түсіндірме материалдар біріктірілген. Егер дипломдық нұсқа үшін бөлек архив керек болса, docs/ бумасын негізгі мәтіннің қосымшасы ретінде қолдануға болады.
