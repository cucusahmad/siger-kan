ALTER TYPE "TestingApplicationStatus" ADD VALUE 'MENUNGGU_PERSETUJUAN_UPTD' AFTER 'PERLU_PERBAIKAN';
ALTER TYPE "TestingApplicationStatus" ADD VALUE 'SAMPEL_DIKIRIM' AFTER 'MENUNGGU_SAMPEL';

ALTER TABLE "testing_applications"
  ADD COLUMN "approved_by_id" BIGINT,
  ADD COLUMN "approved_at" TIMESTAMPTZ(3),
  ADD COLUMN "approval_notes" TEXT;

ALTER TABLE "testing_applications"
  ADD CONSTRAINT "testing_applications_approved_by_id_fkey"
  FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "testing_applications_approved_by_id_idx" ON "testing_applications"("approved_by_id");

CREATE TABLE "sample_shipments" (
  "id" BIGSERIAL PRIMARY KEY,
  "testing_application_id" BIGINT NOT NULL UNIQUE,
  "shipping_date" DATE NOT NULL,
  "shipping_method" VARCHAR(40) NOT NULL,
  "carrier_name" VARCHAR(160),
  "tracking_number" VARCHAR(120),
  "package_count" INTEGER NOT NULL,
  "condition_notes" TEXT,
  "sender_name" VARCHAR(160) NOT NULL,
  "created_by_id" BIGINT NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "sample_shipments_testing_application_id_fkey" FOREIGN KEY ("testing_application_id") REFERENCES "testing_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "sample_shipments_created_by_id_idx" ON "sample_shipments"("created_by_id");

CREATE TABLE "sample_shipment_evidence" (
  "id" BIGSERIAL PRIMARY KEY,
  "sample_shipment_id" BIGINT NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "file_path" VARCHAR(500) NOT NULL,
  "mime_type" VARCHAR(120) NOT NULL,
  "file_size" BIGINT NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sample_shipment_evidence_sample_shipment_id_fkey" FOREIGN KEY ("sample_shipment_id") REFERENCES "sample_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "sample_shipment_evidence_sample_shipment_id_idx" ON "sample_shipment_evidence"("sample_shipment_id");

CREATE TABLE "notifications" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "message" TEXT NOT NULL,
  "href" VARCHAR(500),
  "read_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at");
