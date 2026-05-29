# Hship — Production Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- Node.js 20+
- Access to [Vercel](https://vercel.com) project: `hship-management`
- Railway MySQL database (or equivalent)
- GitHub repo: `https://github.com/tanganhkiet09112005-blip/wed-quan-ly-1`

---

## Step 1 — Set up Production Database (Railway MySQL)

1. Create a Railway project and add a MySQL plugin.
2. In Railway > MySQL > Connect, copy the **Public URL** (format: `mysql://root:PASSWORD@HOST:PORT/railway`).
3. Keep this URL private — **never commit it to git**.

---

## Step 2 — Run Migrations on Production DB

From your local machine, in the project directory:

```cmd
set "DATABASE_URL=mysql://root:PASSWORD@HOST:PORT/railway"
npx prisma migrate status
npx prisma migrate deploy
```

If any migration shows as **failed**, resolve it first:

```cmd
npx prisma migrate resolve --rolled-back <migration_name>
npx prisma migrate deploy
```

✅ All migrations should show as **Applied** before continuing.

---

## Step 3 — Create Production Admin

After migrations pass, create the super admin account:

```cmd
set "DATABASE_URL=mysql://root:PASSWORD@HOST:PORT/railway"
set "ADMIN_EMAIL=admin@yourdomain.vn"
set "ADMIN_PASSWORD=your_strong_password"
node prisma/seed-production-admin.js
```

> ⚠️ **Do NOT run `node prisma/seed.js`** on production — it will wipe all data and insert demo data.

---

## Step 4 — Set Vercel Environment Variables

In Vercel Dashboard > Project Settings > Environment Variables, add:

| Key | Value | Required |
|-----|-------|----------|
| `DATABASE_URL` | Railway MySQL public URL | ✅ |
| `SESSION_SECRET` | 64-char random hex | ✅ |
| `ENCRYPTION_KEY` | 64-char random hex | ✅ |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` | ✅ |
| `WEBHOOK_SECRET` | Random string | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `LOG_LEVEL` | `warn` | Optional |
| `FACEBOOK_APP_SECRET` | From Meta App | Optional |
| `FACEBOOK_VERIFY_TOKEN` | Custom token | Optional |

> Generate secrets: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Step 5 — Deploy to Vercel

Option A — Auto-Deploy (recommended):
- Push to `main` branch → Vercel auto-deploys.

Option B — Manual Vercel CLI:
```cmd
npx vercel login
npx vercel --prod
```

---

## Step 6 — Verify Deployment

Check these endpoints after deploy:

```
GET /api/health           → { status: "ok", database: "connected" }
GET /login                → Login page loads
POST /api/auth/login      → Returns session cookie
GET /admin/dashboard      → Admin portal (admin account required)
GET /customer/dashboard   → Shop portal (shop account required)
```

---

## Rollback

If something goes wrong:
1. In Vercel Dashboard > Deployments, click on a previous deployment > **Promote to Production**.
2. DB migrations cannot be auto-rolled back — use `npx prisma migrate resolve`.

---

## Production Checklist (Quick)

- [ ] DATABASE_URL is NOT localhost
- [ ] All migrations Applied (not Failed)
- [ ] Admin account created
- [ ] SESSION_SECRET and ENCRYPTION_KEY are set
- [ ] NEXT_PUBLIC_APP_URL matches the actual domain
- [ ] NODE_ENV=production
- [ ] /api/health returns { status: "ok" }
- [ ] Login works
