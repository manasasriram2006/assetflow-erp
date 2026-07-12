# AssetFlow - Enterprise Asset & Resource Management System

AssetFlow is a full-stack ERP-style application for asset registration, allocation, transfers, shared-resource booking, maintenance, audits, notifications, and reporting.

## Stack

- React 19, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Zod, React Icons, Recharts
- Node.js, Express.js, JWT, bcrypt, Helmet, CORS, rate limiting
- PostgreSQL, Prisma ORM

## Project Layout

```text
client/    React application
server/    Express API, services, validators, Prisma schema
database/  Database documentation
docs/      Architecture and API notes
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure the API:

```bash
cp server/.env.example server/.env
```

Update `DATABASE_URL` in `server/.env` for your PostgreSQL instance.

3. Create the database schema and seed demo data:

```bash
npm run prisma:migrate --workspace server
npm run prisma:seed --workspace server
```

4. Start both apps:

```bash
npm run dev
```

Client: `http://localhost:5173`

API: `http://localhost:5000`

## Demo Accounts

All seeded accounts use `Password@123`.

- `admin@assetflow.local`
- `manager@assetflow.local`
- `employee@assetflow.local`

## Key Rules Implemented

- Signup always creates an `EMPLOYEE`.
- Only `ADMIN` can promote users.
- Assets receive automatic category-prefixed tags.
- Allocated assets cannot be allocated again.
- Booking overlap is rejected.
- Return dates must be in the future.
- Maintenance updates asset availability when resolved.
- Notifications are stored and expose unread counts.
- Reports include dashboard aggregates and CSV export.
