ALTER TABLE "assets" ADD COLUMN "photoUrl" VARCHAR(255);

CREATE TABLE "asset_history" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "assetId" UUID NOT NULL,
  "actorId" UUID,
  "action" VARCHAR(80) NOT NULL,
  "fromStatus" "AssetStatus",
  "toStatus" "AssetStatus",
  "notes" TEXT,
  "changes" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "asset_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "asset_history_assetId_idx" ON "asset_history"("assetId");
CREATE INDEX "asset_history_actorId_idx" ON "asset_history"("actorId");
CREATE INDEX "asset_history_action_idx" ON "asset_history"("action");
CREATE INDEX "asset_history_createdAt_idx" ON "asset_history"("createdAt");

ALTER TABLE "asset_history"
  ADD CONSTRAINT "asset_history_assetId_fkey"
  FOREIGN KEY ("assetId")
  REFERENCES "assets"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "asset_history"
  ADD CONSTRAINT "asset_history_actorId_fkey"
  FOREIGN KEY ("actorId")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
