# Hship — Go-Live Checklist

## Infrastructure

- [ ] Railway MySQL database is running and accessible
- [ ] All Prisma migrations Applied (none Failed): `npx prisma migrate status`
- [ ] Vercel project is linked to GitHub repo
- [ ] Auto-Deploy enabled on `main` branch

## Secrets & Environment

- [ ] `DATABASE_URL` is NOT localhost
- [ ] `SESSION_SECRET` is set (64-char random hex)
- [ ] `ENCRYPTION_KEY` is set (64-char random hex)
- [ ] `NEXT_PUBLIC_APP_URL` matches production domain
- [ ] `WEBHOOK_SECRET` is set
- [ ] `NODE_ENV=production`
- [ ] `.env` is NOT committed to git (`git status` shows .env ignored)

## Database

- [ ] `npx prisma migrate deploy` completes without errors
- [ ] Admin account created via `node prisma/seed-production-admin.js`
- [ ] Demo seed (`node prisma/seed.js`) has NOT been run on production

## Build & Deploy

- [ ] `npm run build` passes locally
- [ ] Vercel build passes (check Deployments tab)
- [ ] Vercel deployment status is "Ready"
- [ ] No "PrismaClientInitializationError" in Vercel Function logs

## Health & Smoke Tests

- [ ] `GET /api/health` → `{ status: "ok", database: "connected" }`
- [ ] `GET /login` → Login page loads correctly
- [ ] `POST /api/auth/login` with admin credentials → success
- [ ] `GET /admin/dashboard` → loads without 500 error
- [ ] `GET /customer/dashboard` → loads (with shop account)
- [ ] `GET /customer/orders/manage` → loads order list (empty OK)
- [ ] `GET /customer/products` → loads product list
- [ ] `GET /customer/inventory` → loads inventory
- [ ] `GET /customer/channels/pos` → POS loads
- [ ] `GET /customer/invoices` → Invoice module loads

## Module Status Gates

- [ ] Carriers: mock mode confirmed (no production API calls without credentials)
- [ ] Ecommerce: mock sync confirmed (no production channel calls without credentials)
- [ ] Facebook: mock confirmed (no real webhook calls without App Secret)
- [ ] Invoice: sandbox mode confirmed (no real e-invoice without MISA/VNPT credentials)

## Security

- [ ] No raw tokens exposed in API responses
- [ ] No stack traces in production error responses
- [ ] Admin login tested and working
- [ ] Shop login tested and working
- [ ] Cross-shop data isolation: shop user cannot access another shop's data

## Optional (Post-Launch)

- [ ] Custom domain configured in Vercel
- [ ] SSL certificate active (automatic on Vercel)
- [ ] Monitoring / alerting set up (e.g. UptimeRobot pinging `/api/health`)
- [ ] Backup strategy for Railway DB (Railway auto-backups or manual dump)
