ALTER TYPE "TestingWorkOrderStatus" ADD VALUE 'HASIL_TERVERIFIKASI';

ALTER TABLE "testing_work_orders"
  ADD COLUMN "reviewed_by_id" BIGINT,
  ADD COLUMN "reviewed_at" TIMESTAMPTZ(3),
  ADD COLUMN "supervisor_notes" TEXT;

ALTER TABLE "testing_work_orders"
  ADD CONSTRAINT "testing_work_orders_reviewed_by_id_fkey"
  FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "testing_work_orders_reviewed_by_id_reviewed_at_idx"
  ON "testing_work_orders"("reviewed_by_id", "reviewed_at");
