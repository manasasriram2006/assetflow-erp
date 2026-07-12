# AssetFlow Database Design

AssetFlow uses PostgreSQL with Prisma. The database is normalized around master data, asset inventory, operational workflow history, audit evidence, and notifications.

## Tables

| Prisma model         | PostgreSQL table       | Purpose                                               |
| -------------------- | ---------------------- | ----------------------------------------------------- |
| `User`               | `users`                | Authenticated users, roles, and department membership |
| `Department`         | `departments`          | Organization units                                    |
| `Category`           | `categories`           | Asset taxonomy and asset-tag prefixes                 |
| `Asset`              | `assets`               | Physical or shared resources under management         |
| `Allocation`         | `allocations`          | Asset issue and return history                        |
| `Transfer`           | `transfers`            | Asset handover workflow                               |
| `Booking`            | `bookings`             | Shared resource reservations                          |
| `MaintenanceRequest` | `maintenance_requests` | Maintenance workflow and technician assignment        |
| `AuditCycle`         | `audit_cycles`         | Physical audit batches                                |
| `AuditItem`          | `audit_items`          | Asset-level audit verification records                |
| `Notification`       | `notifications`        | User notification inbox                               |

## Relationships

- `departments.id` -> `users.departmentId` with `ON DELETE SET NULL`
- `departments.id` -> `assets.departmentId` with `ON DELETE SET NULL`
- `categories.id` -> `assets.categoryId` with `ON DELETE RESTRICT`
- `assets.id` -> workflow history tables with `ON DELETE RESTRICT`
- `users.id` -> workflow actor columns with `ON DELETE RESTRICT`
- `users.id` -> optional receiver, technician, and auditor columns with `ON DELETE SET NULL`
- `audit_cycles.id` -> `audit_items.auditCycleId` with `ON DELETE CASCADE`
- `users.id` -> `notifications.userId` with `ON DELETE CASCADE`

The cascade rules preserve financial and operational history while allowing ephemeral child rows, such as audit items and notifications, to be cleaned up with their parent.

## Soft Delete

Soft delete is supported with `deletedAt` on records that may need retention:

- users
- departments
- categories
- assets
- allocations
- transfers
- bookings
- maintenance_requests
- audit_cycles
- notifications

`audit_items` are deleted through their parent audit cycle because they do not stand alone as business records.

## Indexes

The schema includes indexes for common filters and joins:

- foreign keys across all relationships
- role and status columns
- date filters such as allocation due dates, booking ranges, audit starts, and maintenance schedules
- soft-delete filtering through `deletedAt`
- asset lookup fields such as `assetTag`, `serialNo`, and `name`

The migration also includes a partial unique index:

```sql
CREATE UNIQUE INDEX "allocations_one_active_asset_idx"
ON "allocations"("assetId")
WHERE "status" = 'ACTIVE' AND "deletedAt" IS NULL;
```

This prevents more than one active allocation for the same asset at the database level.

## Files

- Prisma schema: `server/prisma/schema.prisma`
- Initial migration: `server/prisma/migrations/202607120001_init/migration.sql`
- Seed data: `server/prisma/seed.js`

## Commands

```bash
npm run prisma:generate --workspace server
npm run prisma:migrate --workspace server
npm run prisma:seed --workspace server
```
