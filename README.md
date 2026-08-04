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

# Email notifications (Resend)

Warranty reminders are sent via [Resend](https://resend.com). Set these in `.env` (local) and Vercel (production):

```bash
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=Warranty Vault <onboarding@resend.dev>
RESEND_REPLY_TO=warrantyvault.in@gmail.com
CRON_SECRET=your-random-secret
```

| Variable | Purpose |
|----------|---------|
| `RESEND_FROM_EMAIL` | Visible From address (must be a Resend-verified sender) |
| `RESEND_REPLY_TO` | Where user replies go (your Warranty Vault Gmail) |
| `CRON_SECRET` | Protects `/api/cron/reminders` and `/api/cron/test-email` |

**Important:** Resend cannot send *from* `@gmail.com`. For production branding, verify your domain (e.g. `warrantyvault.in`) in the Resend dashboard (add SPF/DKIM DNS records), then set:

```bash
RESEND_FROM_EMAIL=Warranty Vault <noreply@warrantyvault.in>
RESEND_REPLY_TO=warrantyvault.in@gmail.com
```

Until the domain is verified, use `onboarding@resend.dev` for From. On the free tier, that sender can only deliver to the email on your Resend account.

### Test send (local)

```bash
curl -X POST http://localhost:3000/api/cron/test-email \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"to":"your-resend-account@email.com"}'
# Use :3001 if another app already occupies :3000
```

Daily production reminders run via [`vercel.json`](vercel.json) → `GET /api/cron/reminders`.

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

No extra paid service required. Resend free tier is enough for development and early traffic.

## Required NextAuth env

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-long-random-string
```

If Google env vars are missing, that button stays hidden automatically. Password login always remains available.

---

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

# Future Improvements

- PDF preview support
- Analytics dashboard
- Multi-user organization support
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