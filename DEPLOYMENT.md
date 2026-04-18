# DentFlow KZ - Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Git repository initialized
- Database backup strategy established

---

## Deployment Option 1: Vercel (Recommended)

### Step 1: Prepare for Production

```bash
# 1. Update environment variables
cp .env.local .env.production.local

# Edit .env.production.local:
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
DATABASE_URL="file:./prod.db"
NODE_ENV=production

# 2. Build locally to test
npm run build

# 3. Run production build
npm run build && npm start

# 4. Test in production mode
# Visit http://localhost:3000 and verify all features
```

### Step 2: Deploy to Vercel

```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for production"
git push origin main

# 2. Connect to Vercel
# Visit: https://vercel.com/import
# Select your repository
# Configure environment variables in Vercel dashboard

# 3. Auto-deploy on push
# Vercel automatically builds and deploys on every push to main

# 4. Monitor deployment
# Check: https://vercel.com/dashboard
```

### Configuration in Vercel Dashboard

**Environment Variables:**
```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generated-secret>
DATABASE_URL=file:./prod.db
EMAIL_USER=dentflow.kz@gmail.com
EMAIL_PASS=<app-password>
NODE_ENV=production
```

**Build Settings:**
- Build command: `npm run build`
- Start command: `npm start`
- Install command: `npm install`

---

## Deployment Option 2: Self-Hosted (Node.js + PM2)

### Step 1: Server Preparation

```bash
# 1. SSH into your server
ssh user@your-server.com

# 2. Install Node.js 18+
curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 3. Install PM2 (process manager)
npm install -g pm2

# 4. Install Nginx
sudo apt update && sudo apt install nginx
```

### Step 2: Application Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/dentflow-kz.git
cd dentflow-kz

# 2. Install dependencies
npm install

# 3. Configure production environment
cat > .env.production << EOF
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
DATABASE_URL="file:./prod.db"
EMAIL_USER=dentflow.kz@gmail.com
EMAIL_PASS=<app-password>
NODE_ENV=production
EOF

# 4. Build application
npm run build

# 5. Start with PM2
pm2 start npm --name "dentflow-kz" -- start
pm2 save
pm2 startup

# 6. Check status
pm2 status
```

### Step 3: Nginx Configuration

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/dentflow-kz

# Add:
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

# Enable site
sudo ln -s /etc/nginx/sites-available/dentflow-kz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### Step 5: Monitoring & Maintenance

```bash
# View logs
pm2 logs dentflow-kz

# Restart on code changes
git pull && npm install && npm run build && pm2 restart dentflow-kz

# Backup database
cp prod.db prod.db.backup.$(date +%Y%m%d)

# Schedule backup with cron
0 2 * * * /home/user/dentflow-kz/backup.sh
```

---

## Deployment Option 3: Docker

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
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

### Deploy Docker

```bash
# Build image
docker build -t dentflow-kz .

# Run container
docker run -p 3000:3000 -e NEXTAUTH_SECRET=your-secret dentflow-kz

# Or with Docker Compose
docker-compose up -d
```

---

## Production Checklist

### Security
- [ ] Change default passwords
- [ ] Enable HTTPS/SSL
- [ ] Set strong NEXTAUTH_SECRET
- [ ] Configure CORS headers if needed
- [ ] Enable rate limiting on auth endpoints
- [ ] Set up firewall rules
- [ ] Regular security audits

### Database
- [ ] Set up automated backups (daily)
- [ ] Test backup restoration
- [ ] Enable database logs
- [ ] Monitor database size
- [ ] Plan database migration to PostgreSQL

### Monitoring
- [ ] Set up error logging (Sentry)
- [ ] Set up application monitoring (DataDog, New Relic)
- [ ] Monitor server resources (CPU, RAM, Disk)
- [ ] Set up health checks
- [ ] Configure alerting for critical errors

### Performance
- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Set up caching headers
- [ ] Monitor page load times
- [ ] Optimize database queries

### Maintenance
- [ ] Set up automated dependency updates
- [ ] Schedule monthly security patches
- [ ] Create runbooks for common issues
- [ ] Document deployment procedures
- [ ] Plan for scaling strategy

---

## Rollback Procedure

```bash
# If deployment fails, rollback to previous version
pm2 restart dentflow-kz

# Or with Vercel
# Visit Vercel dashboard -> Deployments -> Select previous version -> Redeploy

# Or restore from backup
git revert HEAD
npm install
npm run build
pm2 restart dentflow-kz
```

---

## Health Check Endpoint

Add to `src/app/api/health/route.ts`:

```typescript
export async function GET() {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}
```

Visit `https://your-domain.com/api/health` to verify deployment is live.

---

## Database Migration for Production

### SQLite → PostgreSQL Migration

```bash
# 1. Install PostgreSQL client
npm install pg

# 2. Create .env for PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/dentflow_kz"

# 3. Run Prisma migration
npx prisma migrate deploy

# 4. Verify data
npx prisma db seed

# 5. Update production .env
# Replace DATABASE_URL in .env.production
```

---

## Support & Troubleshooting

### Issue: "Cannot find module"
```bash
# Solution
rm -rf node_modules
npm install
npm run build
```

### Issue: Database locked error
```bash
# Solution: SQLite connection issue
# Migrate to PostgreSQL for production
# Or restart application and clear connections
pm2 restart dentflow-kz
```

### Issue: Out of memory
```bash
# Solution: Increase Node.js heap
NODE_OPTIONS=--max-old-space-size=2048 npm start
```

### Issue: Slow queries
```bash
# Check Prisma query optimization
npx prisma studio  # Visual database explorer

# Enable query logging
DATABASE_LOG="query,error,warn"
```

---

## Contact & Support

- **Email**: dentflow.kz@gmail.com
- **Issues**: GitHub Issues
- **Documentation**: See README.md
