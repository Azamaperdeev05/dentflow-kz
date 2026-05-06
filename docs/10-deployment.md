# 10. Орналастыру нұсқаулығы (Deployment)

> Толық deployment нұсқаулығы жоба түбіріндегі `DEPLOYMENT.md` файлында.

## 10.1 Қысқаша іске қосу

```bash
# Тәуелділіктер
npm install

# .env баптау
cp .env.example .env
# DATABASE_URL, NEXTAUTH_SECRET, EMAIL_USER, EMAIL_PASS толтырыңыз

# Деректер базасы
npm run db:generate
npm run db:migrate

# Іске қосу
npm run dev
```

## 10.2 Deployment нұсқалары

1. **Vercel** — ең қарапайым, GitHub-тан автоматты deploy
2. **VPS + PM2 + Nginx** — өзіңіздің серверіңізде
3. **Docker** — контейнерлік орналастыру

## 10.3 Production ауысу

SQLite → PostgreSQL көшу:
1. `DATABASE_URL` мәнін PostgreSQL connection string-ке ауыстыру
2. `npx prisma migrate deploy` іске қосу
3. Seed деректерді жүктеу

## 10.4 Gmail SMTP баптау

1. Google аккаунтында 2FA қосыңыз
2. App Password генерациялаңыз: https://myaccount.google.com/apppasswords
3. `.env` файлына `EMAIL_PASS="xxxx xxxx xxxx xxxx"` жазыңыз
