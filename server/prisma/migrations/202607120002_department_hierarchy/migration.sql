ALTER TABLE "departments" ADD COLUMN "parentDepartmentId" UUID;

CREATE INDEX "departments_parentDepartmentId_idx" ON "departments"("parentDepartmentId");

ALTER TABLE "departments"
  ADD CONSTRAINT "departments_parentDepartmentId_fkey"
  FOREIGN KEY ("parentDepartmentId")
  REFERENCES "departments"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
