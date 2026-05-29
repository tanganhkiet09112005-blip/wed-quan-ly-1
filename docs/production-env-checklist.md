# Hship — Production Environment Checklist

## Required Environment Variables (Vercel / VPS)

### Database
| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | MySQL connection string (NOT localhost) | `mysql://root:pwd@host:port/railway` |

### Security
| Variable | Description | How to generate |
|---|---|---|
| `SESSION_SECRET` | JWT/session signing key | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ENCRYPTION_KEY` | AES encryption key for stored tokens | Same as above |
| `WEBHOOK_SECRET` | Carrier webhook verification | Any random string 32+ chars |

### Application
| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Production URL (no trailing slash) | `https://hship-management.vercel.app` |
| `NODE_ENV` | Must be `production` | `production` |
| `LOG_LEVEL` | Logging verbosity | `warn` (production) |

### Facebook / Chatbot (Optional — needed for live FB integration)
| Variable | Description |
|---|---|
| `FACEBOOK_APP_SECRET` | From Meta Developer App |
| `FACEBOOK_VERIFY_TOKEN` | Custom token matching webhook config |

### Carrier API Overrides (Optional — code has defaults)
| Variable | Description |
|---|---|
| `GHN_API_BASE_URL` | Override GHN API base (leave blank to use defaults) |
| `GHTK_API_BASE_URL` | Override GHTK API base |
| `JT_API_BASE_URL` | Override J&T API base |
| `SPX_API_BASE_URL` | Override SPX API base |

## Admin Seed (Local Machine Only — NOT in Vercel)
| Variable | Description |
|---|---|
| `ADMIN_EMAIL` | Email for super admin account |
| `ADMIN_PASSWORD` | Password for super admin account |

---

## Verification Steps

After setting all variables:

1. **Redeploy on Vercel** (or trigger by pushing an empty commit)
2. **Check health:** `curl https://your-domain/api/health`
   - Expected: `{"status":"ok","database":"connected",...}`
3. **Login test:** Visit `/login` with admin credentials
4. **Vercel Function Logs:** No `P1001` (DB unreachable) or `P2021` (table not found) errors

---

## Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `PrismaClientInitializationError` | DATABASE_URL not set or wrong | Check env on Vercel |
| `P1001: Can't reach database server` | DB not running or wrong host | Verify Railway URL |
| `P3018: Migration failed` | Table casing mismatch on MySQL | Run `prisma migrate resolve --rolled-back` then `migrate deploy` |
| `Da xay ra loi he thong` | API 500 — check Vercel function logs | Look at Function logs in Vercel |
| `401 Unauthorized` on dashboard | Session cookie missing | Login again |
