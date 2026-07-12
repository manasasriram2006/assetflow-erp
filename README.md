# AssetFlow ERP

AssetFlow is a full-stack enterprise asset and resource management system built for a hiring hackathon submission. It covers the operational lifecycle of company assets: registration, categorization, allocation, transfers, shared-resource booking, maintenance, audits, notifications, and reporting.

## Highlights

- Role-based ERP workflow for `ADMIN`, `ASSET_MANAGER`, `DEPARTMENT_HEAD`, and `EMPLOYEE`
- Automatic category-prefixed asset tags
- Asset allocation, return, transfer approval, and custody history
- Shared-resource booking with overlap prevention
- Maintenance request lifecycle with technician assignment and attachments
- Audit cycles with auditor assignment, verification, discrepancy reporting, and close rules
- Notification inbox with unread counts and category filters
- Dashboard metrics, trend charts, and CSV exports
- PostgreSQL schema with Prisma migrations, indexes, soft delete, and history tables
- Express security middleware: Helmet, allow-listed CORS, configurable rate limiting, JWT auth, validation, sanitization, and centralized errors

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Zod, React Icons, Recharts
- Backend: Node.js, Express.js, Prisma, JWT, bcrypt, Helmet, CORS, express-rate-limit, Zod
- Database: PostgreSQL
- Tooling: npm workspaces, ESLint, Prettier

## Project Layout

```text
client/       React application
server/       Express API, services, validators, middleware, Prisma schema
database/     Database notes and relationship summary
docs/         API, architecture, ERD, and submission review documentation
```

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Update `server/.env` with your PostgreSQL connection string and strong JWT secrets. For local development, the default client URL is `http://localhost:5173` and the API URL is `http://localhost:5000`. `CLIENT_ORIGIN` accepts a comma-separated allow-list for deployed clients.

3. Generate Prisma client, run migrations, and seed demo data:

```bash
npm run prisma:generate
npm run prisma:migrate --workspace server
npm run prisma:seed --workspace server
```

4. Start the application:

```bash
npm run dev
```

- Client: `http://localhost:5173`
- API: `http://localhost:5000`
- Health check: `http://localhost:5000/health`

## Demo Accounts

All seeded demo accounts use `Password@123`.

| Role          | Email                      |
| ------------- | -------------------------- |
| Admin         | `admin@assetflow.local`    |
| Asset Manager | `manager@assetflow.local`  |
| Employee      | `employee@assetflow.local` |

## Scripts

| Command                                     | Purpose                        |
| ------------------------------------------- | ------------------------------ |
| `npm run dev`                               | Run server and client together |
| `npm run dev:server`                        | Run the Express API            |
| `npm run dev:client`                        | Run the Vite client            |
| `npm run build`                             | Build the production client    |
| `npm run start`                             | Start the server               |
| `npm run lint`                              | Run ESLint                     |
| `npm run format:check`                      | Check formatting               |
| `npm run prisma:generate`                   | Generate Prisma client         |
| `npm run prisma:migrate --workspace server` | Apply database migrations      |
| `npm run prisma:seed --workspace server`    | Seed demo data                 |

## Business Rules Implemented

- Signup always creates an `EMPLOYEE`.
- Only `ADMIN` can create users and promote roles.
- Departments support parent-child hierarchy and cycle prevention.
- Assets require a category and receive generated tags like `LAP-00001`.
- Assets cannot be allocated if not `AVAILABLE`.
- A database partial unique index prevents more than one active allocation for an asset.
- Transfers require an active allocation and approval by an authorized role.
- Bookings reject overlapping windows.
- Maintenance cannot be requested for lost, retired, or disposed assets.
- Maintenance resolution restores the asset to allocated, reserved, or available based on active records.
- Audits cannot close until every audit item is verified.
- Soft deletion preserves operational history.

## Documentation

- API reference: [docs/API.md](docs/API.md)
- Architecture review: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- ER diagram description: [docs/ERD.md](docs/ERD.md)
- Submission review and improvement plan: [docs/SUBMISSION_REVIEW.md](docs/SUBMISSION_REVIEW.md)
- Database design: [database/README.md](database/README.md)

## Final Submission Notes

The project is ready to demonstrate as an end-to-end ERP workflow. Before recording or presenting, run `npm run lint` and `npm run build`, seed the database, and demo the workflow with the seeded admin account.

For production deployment, configure strong JWT secrets, set the correct `CLIENT_ORIGIN`, use managed PostgreSQL, serve uploaded files from private object storage, persist refresh-token revocation state, and place the API behind HTTPS.
