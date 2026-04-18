# 09. Тестілеу және сапа

## 1. Тест стратегиясы

- Unit/Integration тесттер: Vitest.
- Build және type safety: `npm run build`.
- API smoke тексеру: endpoint қолжетімділігі және статус кодтары.

## 2. Қамтылатын бағыттар

- Auth flow: register, verify, OTP, reset password.
- Clinical flow: appointment, treatment, payment.
- Communication: chat, notifications.
- Security: role restrictions, rate limit, audit generation.

## 3. Сапа көрсеткіштері

- TypeScript compile қатесіз өтуі.
- Build стадияларының толық аяқталуы.
- Негізгі API route-тардың expected код қайтаруы.

## 4. Белгіленген техникалық тәуекелдер

### 4.1 SQLite lock

Integration тест кезінде dev сервер қатар жұмыс істесе, `database is locked` қатесі туындауы мүмкін.

Себебі:

- тест `prisma db push --force-reset` орындайды;
- ал dev процесс бір уақытта DB-ға қосылып тұр.

Шешім:

- тестті dev серверсіз бөлек орындау;
- не бөлек test database қолдану;
- не PostgreSQL-ға көшу.

### 4.2 Dev chunk/cache тұрақсыздығы

Кей ортада `.next` кеші бұзылса, chunk 404 қателері шығуы ықтимал.

Шешім:

- `.next` тазалау;
- бір ғана dev процесс қалдыру;
- қайта build жасау.

## 5. Сапаны арттыру жоспары

1. CI pipeline (lint + test + build).
2. E2E Playwright тесттері.
3. API contract тест.
4. Coverage метрикасын енгізу.

## 6. Қорытынды

Жоба production build деңгейінде тұрақты, ал тест ортасында анықталған мәселелер конфигурациялық/орталық сипатта, бизнес-логика қатесі емес.
