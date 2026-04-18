# 10. Енгізу және пайдалану (Deployment & Operations)

## 1. Енгізу ортасы

- Node.js 18+
- npm
- Prisma
- SQLite (ағымдағы)

## 2. Environment айнымалылары

Минималды конфигурация:

- DATABASE_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- EMAIL_USER
- EMAIL_PASS
- NODE_ENV

## 3. Қадамдық енгізу

1. Репозиторийді алу.
2. `npm install`.
3. Environment баптау.
4. `npm run db:generate`.
5. `npm run db:migrate`.
6. `npm run build`.
7. `npm run start`.

## 4. Жұмыс режимдері

- Development: `npm run dev`
- Production: `npm run build && npm run start`

## 5. Админ дайындау

- `npm run admin:create`
- Бірінші кіруден кейін 2FA қосу ұсынылады.

## 6. Бэкап және қалпына келтіру

SQLite файлдық backup:

- жоспарлы көшіру (күнделікті)
- архивтеу және версиялау
- қалпына келтіруді периодты тексеру

## 7. Мониторинг

- Қолданба логтары
- Қауіпсіздік аудит логтары
- Қате жиілігі, response time
- Диск кеңістігі және DB өлшемі

## 8. Production ұсыныстары

1. Reverse proxy (Nginx) және HTTPS.
2. PM2/systemd арқылы процесс бақылау.
3. CI/CD (GitHub Actions).
4. SQLite -> PostgreSQL миграция жол картасы.
