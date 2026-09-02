# Warranty Vault AI

AI-powered warranty and product management platform built with Next.js 16, Prisma, PostgreSQL, UploadThing, and Tailwind CSS.

Track warranties, upload invoices, manage product documents, and monitor expiry dates from a modern dashboard.

---

# Features

- Product management dashboard
- Add / Edit / Delete products
- Warranty tracking system
- Warranty expiry alerts
- Document uploads
- Invoice & warranty document storage
- Product detail pages
- Warranty usage progress tracking
- Authentication system (password, Google, email OTP)
- Responsive UI
- REST API architecture
- Prisma ORM integration

---

# Tech Stack

## Frontend
- Next.js 16
- React
- TypeScript
- Tailwind CSS
- Sonner Toasts

## Backend
- Next.js Route Handlers
- Prisma ORM
- PostgreSQL

## Authentication
- NextAuth.js (credentials, Google, email OTP)

## File Uploads
- UploadThing

## AI (Planned)
- Gemini OCR invoice scanning

---

# Folder Structure

```bash
src/
 ├── app/
 │   ├── api/
 │   ├── dashboard/
 │   └── auth/
 │
 ├── components/
 │
 ├── lib/
 │
 └── prisma/
```

---

# Installation

```bash
git clone <repo-url>

cd warranty-vault-ai

npm install
```
---

# Prisma Setup

```bash
npx prisma generate

npx prisma db push
```

---

# Run Development Server

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

---

# API Routes

## Products

| Method | Route |
|--------|-------|
| GET | /api/products/[id] |
| POST | /api/products |
| PUT | /api/products/[id] |
| DELETE | /api/products/[id] |

---

# Email notifications (Resend free tier)

OTP codes and warranty reminders are sent via [Resend](https://resend.com).

## Free tier limits

| Limit | Value |
|-------|-------|
| Cost | $0 |
| Emails / day | ~100 (app reserves 95 by default) |
| Emails / month | ~3,000 |
| Domains | 1 verified domain |

The app guards the daily cap and returns clear errors instead of failing silently.

## Recommended free production setup

1. Create a Resend account + API key
2. Open [Resend Domains](https://resend.com/domains) and add `warrantyvault.in`
3. Add the SPF / DKIM / DMARC DNS records Resend shows
4. Wait until the domain status is **Verified**
5. Set env (local + Vercel):

```bash
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=Warranty Vault <noreply@warrantyvault.in>
RESEND_REPLY_TO=warrantyvault.in@gmail.com
RESEND_TEST_RECIPIENT=warrantyvault.in@gmail.com
RESEND_DAILY_LIMIT=95
CRON_SECRET=your-random-secret
```

| Variable | Purpose |
|----------|---------|
| `RESEND_FROM_EMAIL` | Visible From address (must use a Resend-verified domain) |
| `RESEND_REPLY_TO` | Where user replies go |
| `RESEND_TEST_RECIPIENT` | Allowed recipient if you temporarily fall back to `onboarding@resend.dev` |
| `RESEND_DAILY_LIMIT` | App-side buffer under Resend free daily quota (default 95) |
| `CRON_SECRET` | Protects `/api/cron/reminders` and `/api/cron/test-email` |

**Important:** Resend cannot send *from* `@gmail.com`. Until the domain is verified, you may temporarily use:

```bash
RESEND_FROM_EMAIL=Warranty Vault <onboarding@resend.dev>
```

That shared sender can only deliver to your Resend account email. After domain verification, switch to `noreply@warrantyvault.in` so OTP/reminders work for any user.

### Test send (local)

```bash
curl -X POST http://localhost:3000/api/cron/test-email \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"to":"warrantyvault.in@gmail.com"}'
```

Daily production reminders run via [`vercel.json`](vercel.json) → `GET /api/cron/reminders`.

Check email readiness anytime:

```bash
curl http://localhost:3000/api/auth/options
```

Look for `emailSetup.domainReady: true`.

---

# Free sign-in options (Google / Email OTP)

All of these are free to set up. SMS OTP is intentionally **not** included (SMS providers charge money).

## 1) Google Sign-In (free)

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → **APIs & Services → Credentials → Create credentials → OAuth client ID**
3. Application type: **Web application**
4. Authorized redirect URI:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://YOUR_DOMAIN/api/auth/callback/google`
5. Copy Client ID + Client Secret into env:

```bash
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
```

## 2) Email one-time code (free via Resend)

Uses your existing `RESEND_API_KEY`. Users get a 6-digit code that expires in 10 minutes. If the user does not exist yet, an account is created automatically (passwordless).

For any-inbox OTP in production, complete the domain verification steps above. Local/dev can still show a temporary code when Resend’s shared sender blocks the recipient.

## Required NextAuth env

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-long-random-string
```

If Google env vars are missing, that button stays hidden automatically. Password login always remains available.

---

# Next priorities

Do these in order — trust and reliability before more features:

1. **Production email** — Verify `warrantyvault.in` in Resend, set `RESEND_FROM_EMAIL` / `CRON_SECRET` on Vercel so OTP and warranty reminders reach real users.
2. **First-run empty dashboard** — When a user has 0 products, show one clear “Add your first product” path.
3. **Mobile / polish pass** — Document viewer, logo, and add-product flow on small screens.
4. **Later (after real usage)** — Pricing, help center, analytics dashboard, multi-user orgs, export reports.

# Production Features

- App Router architecture
- Dynamic route handling
- Error boundaries
- Loading skeletons
- Responsive UI
- Prisma ORM integration
- PostgreSQL database
- Authentication system
- File upload support
- Warranty analytics
- Email warranty reminders (Resend + cron)
- Household vault (email invite, owner/member)
- Lean marketing footer (landing only)

# Future Improvements

- PDF preview enhancements
- Analytics dashboard
- Multi-user organization / RBAC (beyond household)
- Cloud storage optimization
- Export reports

---

# Screenshots

## Dashboard
<img width="100%" alt="Dashboard Screenshot" src="YOUR_SCREENSHOT_URL" />

## Product Details
<img width="100%" alt="Product Page Screenshot" src="YOUR_SCREENSHOT_URL" />.

---

# Author

Built by Harshad Thorat