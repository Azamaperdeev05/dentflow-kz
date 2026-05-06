# DentFlow KZ — Орналастыру нұсқаулығы (Deployment Guide)

## 📋 Алғышарттар

- Node.js 18+ орнатылған
- npm немесе yarn менеджері
- Git репозиторийі дайын
- Gmail аккаунты (App Password генерацияланған)

---

## 🔧 Environment айнымалылары

`.env` файлында міндетті түрде мыналар болуы керек:

```env
# Деректер базасы
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="кемінде-32-символды-кездейсоқ-жол"

# Email (Gmail SMTP)
EMAIL_USER="youremail@gmail.com"
EMAIL_PASS="xxxx xxxx xxxx xxxx"   # Google App Password (16 символ)

# Шифрлау
ENCRYPTION_KEY="32-байт-hex-кілт"
```

> ⚠️ `EMAIL_PASS` — бұл Gmail парольі емес, Google App Password. 2FA қосылған Google аккаунтынан генерациялаңыз: https://myaccount.google.com/apppasswords

---

## 🚀 1-нұсқа: Vercel (ұсынылатын)

### Қадамдар

```bash
# 1. Production build-ді локалды тексеру
npm run build
npm start

# 2. GitHub-қа жүктеу
git add .
git commit -m "Production ready"
git push origin main

# 3. Vercel-ға қосу
# https://vercel.com/import → репозиторийді таңдау
```

### Vercel Dashboard-та баптау

| Айнымалы | Мәні |
|----------|------|
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` |
| `NEXTAUTH_SECRET` | Генерацияланған құпия кілт |
| `DATABASE_URL` | `file:./prod.db` |
| `EMAIL_USER` | Gmail аккаунт |
| `EMAIL_PASS` | App Password |

---

## 🖥 2-нұсқа: VPS сервер (Node.js + PM2)

### Серверді дайындау

```bash
# Node.js орнату
curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# PM2 орнату
npm install -g pm2
```

### Қосымшаны іске қосу

```bash
git clone https://github.com/your-org/dentflow-kz.git
cd dentflow-kz

npm install
npm run db:generate
npm run db:migrate
npm run build

# PM2-мен іске қосу
pm2 start npm --name "dentflow-kz" -- start
pm2 save
pm2 startup
```

### Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL сертификаты (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo systemctl enable certbot.timer
```

---

## 🐳 3-нұсқа: Docker

### Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret
      - DATABASE_URL=file:./prod.db
      - NODE_ENV=production
    volumes:
      - ./prod.db:/app/prod.db
    restart: unless-stopped
```

```bash
docker-compose up -d
```

---

## ✅ Production чек-листі

### Қауіпсіздік
- [ ] Әдепкі парольдерді ауыстыру
- [ ] HTTPS/SSL қосу
- [ ] `NEXTAUTH_SECRET` кемінде 32 символ
- [ ] Rate limiting конфигурациялау
- [ ] Firewall ережелерін орнату
- [ ] 2FA барлық дәрігерлерге міндеттеу

### Деректер базасы
- [ ] Автоматты backup (күн сайын)
- [ ] Backup қалпына келтіруді тексеру
- [ ] PostgreSQL-ға көшу жоспарлау (production)

### Мониторинг
- [ ] Error logging (Sentry)
- [ ] Application monitoring (DataDog/New Relic)
- [ ] Health check endpoint: `GET /api/health`
- [ ] Alerting баптау

---

## 🔄 Жаңарту процедурасы

```bash
# Код жаңарту
git pull origin main
npm install
npm run db:generate
npm run build
pm2 restart dentflow-kz
```

## ↩️ Rollback процедурасы

```bash
# Алдыңғы нұсқаға қайту
git revert HEAD
npm install
npm run build
pm2 restart dentflow-kz
```

---

## ❓ Жиі кездесетін мәселелер

| Мәселе | Шешімі |
|--------|--------|
| "Cannot find module" | `rm -rf node_modules && npm install && npm run build` |
| "Database locked" | PM2 restart немесе PostgreSQL-ға көшу |
| "Out of memory" | `NODE_OPTIONS=--max-old-space-size=2048 npm start` |
| "SMTP auth error" | Google App Password жаңарту |
| "2FA QR код көрінбейді" | `otpauth` пакетін тексеру |
