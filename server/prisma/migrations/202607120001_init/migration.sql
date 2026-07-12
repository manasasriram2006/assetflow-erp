CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "Role" AS ENUM ('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE');
CREATE TYPE "AssetStatus" AS ENUM ('AVAILABLE', 'ALLOCATED', 'RESERVED', 'MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED');
CREATE TYPE "AllocationStatus" AS ENUM ('ACTIVE', 'RETURNED', 'OVERDUE');
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');
CREATE TYPE "BookingStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS', 'RESOLVED');
CREATE TYPE "AuditStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');
CREATE TYPE "AuditItemStatus" AS ENUM ('VERIFIED', 'MISSING', 'DAMAGED', 'UNCHECKED');
CREATE TYPE "NotificationType" AS ENUM ('ASSET_ASSIGNED', 'TRANSFER_APPROVED', 'MAINTENANCE_APPROVED', 'BOOKING_REMINDER', 'OVERDUE_RETURN', 'AUDIT_DISCREPANCY');

CREATE TABLE "departments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(120) NOT NULL,
  "code" VARCHAR(20) NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(120) NOT NULL,
  "prefix" VARCHAR(12) NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(120) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
  "departmentId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "assetTag" VARCHAR(40) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "serialNo" VARCHAR(120),
  "status" "AssetStatus" NOT NULL DEFAULT 'AVAILABLE',
  "value" DECIMAL(12,2),
  "purchaseDate" TIMESTAMP(3),
  "location" VARCHAR(160),
  "categoryId" UUID NOT NULL,
  "departmentId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "allocations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "assetId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueAt" TIMESTAMP(3),
  "returnedAt" TIMESTAMP(3),
  "status" "AllocationStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transfers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "assetId" UUID NOT NULL,
  "requesterId" UUID NOT NULL,
  "receiverId" UUID,
  "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
  "reason" TEXT NOT NULL,
  "decidedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bookings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "assetId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "purpose" TEXT NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'UPCOMING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bookings_valid_range" CHECK ("endsAt" > "startsAt")
);

CREATE TABLE "maintenance_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "assetId" UUID NOT NULL,
  "requesterId" UUID NOT NULL,
  "technicianId" UUID,
  "title" VARCHAR(160) NOT NULL,
  "description" TEXT NOT NULL,
  "status" "MaintenanceStatus" NOT NULL DEFAULT 'PENDING',
  "scheduledAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_cycles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(160) NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "status" "AuditStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "audit_cycles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "auditCycleId" UUID NOT NULL,
  "assetId" UUID NOT NULL,
  "auditorId" UUID,
  "status" "AuditItemStatus" NOT NULL DEFAULT 'UNCHECKED',
  "notes" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "audit_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "message" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");
CREATE INDEX "departments_deletedAt_idx" ON "departments"("deletedAt");

CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "categories_prefix_key" ON "categories"("prefix");
CREATE INDEX "categories_deletedAt_idx" ON "categories"("deletedAt");

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

CREATE UNIQUE INDEX "assets_assetTag_key" ON "assets"("assetTag");
CREATE UNIQUE INDEX "assets_serialNo_key" ON "assets"("serialNo");
CREATE INDEX "assets_status_idx" ON "assets"("status");
CREATE INDEX "assets_categoryId_idx" ON "assets"("categoryId");
CREATE INDEX "assets_departmentId_idx" ON "assets"("departmentId");
CREATE INDEX "assets_deletedAt_idx" ON "assets"("deletedAt");
CREATE INDEX "assets_name_idx" ON "assets"("name");

CREATE INDEX "allocations_assetId_idx" ON "allocations"("assetId");
CREATE INDEX "allocations_userId_idx" ON "allocations"("userId");
CREATE INDEX "allocations_status_idx" ON "allocations"("status");
CREATE INDEX "allocations_dueAt_idx" ON "allocations"("dueAt");
CREATE INDEX "allocations_deletedAt_idx" ON "allocations"("deletedAt");
CREATE UNIQUE INDEX "allocations_one_active_asset_idx" ON "allocations"("assetId") WHERE "status" = 'ACTIVE' AND "deletedAt" IS NULL;

CREATE INDEX "transfers_assetId_idx" ON "transfers"("assetId");
CREATE INDEX "transfers_requesterId_idx" ON "transfers"("requesterId");
CREATE INDEX "transfers_receiverId_idx" ON "transfers"("receiverId");
CREATE INDEX "transfers_status_idx" ON "transfers"("status");
CREATE INDEX "transfers_deletedAt_idx" ON "transfers"("deletedAt");

CREATE INDEX "bookings_assetId_idx" ON "bookings"("assetId");
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "bookings_startsAt_endsAt_idx" ON "bookings"("startsAt", "endsAt");
CREATE INDEX "bookings_deletedAt_idx" ON "bookings"("deletedAt");

CREATE INDEX "maintenance_requests_assetId_idx" ON "maintenance_requests"("assetId");
CREATE INDEX "maintenance_requests_requesterId_idx" ON "maintenance_requests"("requesterId");
CREATE INDEX "maintenance_requests_technicianId_idx" ON "maintenance_requests"("technicianId");
CREATE INDEX "maintenance_requests_status_idx" ON "maintenance_requests"("status");
CREATE INDEX "maintenance_requests_scheduledAt_idx" ON "maintenance_requests"("scheduledAt");
CREATE INDEX "maintenance_requests_deletedAt_idx" ON "maintenance_requests"("deletedAt");

CREATE INDEX "audit_cycles_status_idx" ON "audit_cycles"("status");
CREATE INDEX "audit_cycles_startsAt_idx" ON "audit_cycles"("startsAt");
CREATE INDEX "audit_cycles_deletedAt_idx" ON "audit_cycles"("deletedAt");

CREATE UNIQUE INDEX "audit_items_auditCycleId_assetId_key" ON "audit_items"("auditCycleId", "assetId");
CREATE INDEX "audit_items_assetId_idx" ON "audit_items"("assetId");
CREATE INDEX "audit_items_auditorId_idx" ON "audit_items"("auditorId");
CREATE INDEX "audit_items_status_idx" ON "audit_items"("status");

CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");
CREATE INDEX "notifications_readAt_idx" ON "notifications"("readAt");
CREATE INDEX "notifications_deletedAt_idx" ON "notifications"("deletedAt");

ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "assets" ADD CONSTRAINT "assets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assets" ADD CONSTRAINT "assets_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_auditCycleId_fkey" FOREIGN KEY ("auditCycleId") REFERENCES "audit_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
