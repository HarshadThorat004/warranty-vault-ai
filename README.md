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
- Authentication system
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
- NextAuth.js

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

# Future Improvements

- AI OCR invoice scanning
- Email warranty reminders
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