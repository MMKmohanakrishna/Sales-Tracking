# Divine Frames — Photo Frame Sales & Payment Manager

A simple, mobile-first business management app for a small God-photo-frame business in Bengaluru. It tracks customers, frames, sales, partial/pending payments, inventory, and reports — so the owner never has to remember or calculate anything by hand.

> **Divine Frames** is a placeholder brand name. Change the business name, phone, and address any time from **Settings** in the app.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, React 18, Tailwind CSS, Lucide icons, Framer Motion, React Hook Form + Zod, TanStack Query, Recharts
- **Backend:** Node.js, Express, TypeScript, Mongoose
- **Database:** MongoDB
- **Auth:** JWT + bcryptjs, protected API routes and protected frontend routes

## Project Structure

```
god-frame-business/  (this repo root)
├── frontend/       Next.js app (App Router)
│   ├── app/
│   │   ├── (auth)/login
│   │   └── (dashboard)/  dashboard, customers, frames, sales, outstanding, payments, reports, settings
│   ├── components/  ui/, shared/, layout/
│   ├── lib/         api.ts, utils.ts
│   ├── hooks/       React Query hooks + auth context
│   └── types/
├── backend/
│   └── src/
│       ├── config/       MongoDB connection
│       ├── controllers/  route handlers
│       ├── middleware/   auth, error handling, validation
│       ├── models/       Mongoose schemas
│       ├── routes/
│       ├── services/     sale & payment business logic (atomic, server-recalculated)
│       ├── scripts/      seedAdmin.ts, seedDemo.ts
│       └── server.ts
└── README.md
```

## Requirements

- Node.js 18+
- MongoDB 6+ (local install, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
  - **Multi-document transactions** (used when creating a sale) require MongoDB to run as a **replica set**. A single free Atlas cluster is already a replica set. A plain local `mongod` (standalone) is not — the app detects this and automatically falls back to a safe sequential write path for local development, so it still works either way.

## 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/divine-frames
JWT_SECRET=change_this_to_a_long_random_secret_string
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Create the first owner login (interactive prompt, or press Enter to accept the defaults shown):

```bash
npm run seed:admin
```

(Optional) Load sample customers/frames/sales so the dashboard has data to show immediately — clearly marked `[DEMO DATA]`, never run this in production:

```bash
npm run seed:demo
```

Start the API:

```bash
npm run dev
```

The API runs on `http://localhost:5000`. Health check: `GET /health`.

Run the business-logic test suite:

```bash
npm test
```

## 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`, log in with the owner account created above, and you're in.

## Environment Variables Reference

**Backend (`backend/.env`)**

| Variable | Description |
|---|---|
| `PORT` | Port the Express API listens on |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random secret used to sign session tokens — never commit a real value |
| `JWT_EXPIRES_IN` | Session token lifetime (e.g. `7d`) |
| `FRONTEND_URL` | Used for CORS — the frontend's origin |
| `NODE_ENV` | `development` or `production` |
| `CLOUDINARY_CLOUD_NAME` | Optional. From your [Cloudinary console](https://cloudinary.com/console). Leave blank to store photos as base64 in MongoDB instead. |
| `CLOUDINARY_API_KEY` | Optional, pairs with the above |
| `CLOUDINARY_API_SECRET` | Optional, pairs with the above — treat like a password, never commit it |

**Frontend (`frontend/.env.local`)**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API, e.g. `http://localhost:5000/api` |

## Core Business Logic

- **Every total is calculated by the server, never trusted from the client.** Sale subtotal/discount/total/paid/pending and payment status are recomputed on the backend from the submitted items and current product prices.
- **Customer balance is never incremented blindly.** After every sale or payment write, `totalPurchased` / `totalPaid` / `totalPending` on the `Customer` document are *recomputed from the underlying Sale and Payment records* (see `backend/src/services/ledgerService.ts`), so the numbers can never drift out of sync.
- **Sale creation is atomic** (`backend/src/services/saleService.ts`): validates the customer, validates each product and its stock, recalculates prices server-side, creates the sale + initial payment (if any), decrements inventory, writes an `InventoryMovement` audit record, and recomputes the customer balance — all inside a MongoDB transaction where the deployment supports it (replica set / Atlas), with an automatic sequential fallback for a standalone local `mongod`.
- **Payment allocation is explicit.** A payment recorded against a specific sale reduces that sale's balance. A payment recorded at the customer level (e.g. from the Money to Collect page) is allocated FIFO across that customer's oldest outstanding sales first — it never guesses ambiguously.
- **Frame history is preserved, customer deletion is permanent.** A *frame* with existing sales is archived (`isActive: false`) instead of deleted when "removed," so past sale line items still display correctly. A *customer*, by contrast, is deleted **permanently** along with **all** of their sales and payment records — an explicit product decision (see `backend/src/services/customerService.ts`). Deleting a customer also **restores stock** for whatever they bought, and their sales stop counting toward revenue/report totals. The UI warns clearly before this happens, especially when the customer has a pending balance. This is irreversible.
- **Inventory cannot go negative** unless the "Allow negative stock" setting is explicitly enabled; otherwise the sale is rejected with a clear "Only N available" message.

## API Overview

All endpoints are under `/api` and (except `/api/auth/login`) require `Authorization: Bearer <token>`.

```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/change-password

GET    /api/customers                 GET    /api/customers/:id/ledger
POST   /api/customers                 GET    /api/customers/:id/sales
GET    /api/customers/:id             GET    /api/customers/:id/payments
PUT    /api/customers/:id
DELETE /api/customers/:id

GET    /api/frames                    POST   /api/frames/:id/adjust-stock
POST   /api/frames                    GET    /api/frames/:id/inventory-history
GET    /api/frames/:id
PUT    /api/frames/:id
DELETE /api/frames/:id

GET    /api/sales
POST   /api/sales
GET    /api/sales/:id
PUT    /api/sales/:id                 (notes only — financial fields are immutable after creation)

GET    /api/payments
POST   /api/payments
GET    /api/payments/:id

GET    /api/outstanding

GET    /api/reports/dashboard
GET    /api/reports/sales
GET    /api/reports/payments
GET    /api/reports/top-frames

GET    /api/settings
PUT    /api/settings

GET    /api/export/customers.csv
GET    /api/export/sales.csv
GET    /api/export/payments.csv
```

Responses follow a consistent shape:

```json
{ "success": true, "data": { } }
{ "success": false, "message": "Customer not found" }
```

## Deployment

**Backend:** deploy as any Node process (Render, Railway, a VPS with PM2, etc.). Run `npm run build` then `npm start`. Point `MONGODB_URI` at a managed MongoDB (Atlas recommended — it's already a replica set, so sale transactions run at full safety). Set `FRONTEND_URL` to your deployed frontend's origin for CORS.

**Frontend:** deploy to Vercel or any Node host. Run `npm run build` then `npm start`, or use the platform's Next.js preset. Set `NEXT_PUBLIC_API_URL` to your deployed backend's `/api` URL.

## Security Notes

- Passwords are hashed with bcryptjs; plaintext passwords are never stored or logged.
- JWT-based sessions; all business routes require a valid token.
- Login is rate-limited (10 attempts / 15 minutes per IP).
- MongoDB query input is sanitized against operator injection.
- CORS is restricted to `FRONTEND_URL`.
- No secrets are committed — see `.env.example` in both `backend/` and `frontend/`.

## What This App Intentionally Does Not Do

Per the product brief, this app deliberately excludes WhatsApp/SMS integration, online payments, a customer-facing portal, loyalty/coupons, GST/payroll accounting, multi-company support, and AI chat features — it stays focused on sales, customers, payments, and inventory for one small business owner.
