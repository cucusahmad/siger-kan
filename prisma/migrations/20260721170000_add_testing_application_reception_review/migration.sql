ALTER TABLE "testing_applications"
ADD COLUMN "reception_checklist" JSONB,
ADD COLUMN "correction_notes" TEXT,
ADD COLUMN "reviewed_by_id" BIGINT,
ADD COLUMN "reviewed_at" TIMESTAMPTZ(3);

ALTER TABLE "testing_applications"
ADD CONSTRAINT "testing_applications_reviewed_by_id_fkey"
FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "testing_applications_reviewed_by_id_idx"
ON "testing_applications"("reviewed_by_id");
