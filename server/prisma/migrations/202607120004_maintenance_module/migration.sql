CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

ALTER TABLE "maintenance_requests"
  ADD COLUMN "priority" "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN "attachments" JSONB;

CREATE INDEX "maintenance_requests_priority_idx" ON "maintenance_requests"("priority");
