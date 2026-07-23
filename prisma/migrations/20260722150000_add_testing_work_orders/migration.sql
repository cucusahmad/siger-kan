CREATE TYPE "TestingWorkOrderType" AS ENUM ('INTERNAL', 'SUBCONTRACT');

CREATE TYPE "TestingWorkOrderStatus" AS ENUM (
  'MENUNGGU_PENUGASAN_ANALIS',
  'MENUNGGU_PENGIRIMAN_LAB_MITRA',
  'DALAM_PENGUJIAN',
  'MENUNGGU_VERIFIKASI_PENYELIA'
);

CREATE TYPE "TestingWorkOrderPriority" AS ENUM ('RENDAH', 'NORMAL', 'TINGGI', 'MENDESAK');

CREATE TYPE "TestingWorkOrderDocumentType" AS ENUM (
  'LAPORAN_HASIL_UJI',
  'WORKSHEET',
  'CERTIFICATE_OF_ANALYSIS',
  'FOTO_HASIL',
  'DOKUMEN_PENDUKUNG_LAIN'
);

CREATE TABLE "sample_review_parameters" (
  "id" BIGSERIAL PRIMARY KEY,
  "sample_review_id" BIGINT NOT NULL,
  "application_testing_parameter_id" BIGINT NOT NULL,
  "decision" "SampleReviewDecision" NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "sample_review_parameters_sample_review_id_fkey"
    FOREIGN KEY ("sample_review_id") REFERENCES "sample_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "sample_review_parameters_application_testing_parameter_id_fkey"
    FOREIGN KEY ("application_testing_parameter_id") REFERENCES "application_testing_parameters"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "testing_work_orders" (
  "id" BIGSERIAL PRIMARY KEY,
  "work_order_number" VARCHAR(48) NOT NULL,
  "testing_application_id" BIGINT NOT NULL,
  "application_testing_parameter_id" BIGINT NOT NULL,
  "type" "TestingWorkOrderType" NOT NULL,
  "status" "TestingWorkOrderStatus" NOT NULL,
  "priority" "TestingWorkOrderPriority" NOT NULL DEFAULT 'NORMAL',
  "analyst_id" BIGINT,
  "assigned_by_id" BIGINT,
  "assigned_at" TIMESTAMPTZ(3),
  "target_completion_date" DATE,
  "testing_method" VARCHAR(250),
  "laboratory_equipment" VARCHAR(250),
  "laboratory_room" VARCHAR(160),
  "work_instructions" TEXT,
  "analyst_notes" TEXT,
  "partner_laboratory_id" BIGINT,
  "sent_to_supervisor_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "testing_work_orders_testing_application_id_fkey"
    FOREIGN KEY ("testing_application_id") REFERENCES "testing_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "testing_work_orders_application_testing_parameter_id_fkey"
    FOREIGN KEY ("application_testing_parameter_id") REFERENCES "application_testing_parameters"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "testing_work_orders_analyst_id_fkey"
    FOREIGN KEY ("analyst_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "testing_work_orders_assigned_by_id_fkey"
    FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "testing_work_orders_partner_laboratory_id_fkey"
    FOREIGN KEY ("partner_laboratory_id") REFERENCES "laboratories"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "testing_work_order_documents" (
  "id" BIGSERIAL PRIMARY KEY,
  "testing_work_order_id" BIGINT NOT NULL,
  "type" "TestingWorkOrderDocumentType" NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "file_path" VARCHAR(500) NOT NULL,
  "mime_type" VARCHAR(120) NOT NULL,
  "file_size" BIGINT NOT NULL,
  "uploaded_by_id" BIGINT NOT NULL,
  "uploaded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "testing_work_order_documents_testing_work_order_id_fkey"
    FOREIGN KEY ("testing_work_order_id") REFERENCES "testing_work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "testing_work_order_documents_uploaded_by_id_fkey"
    FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "sample_review_parameters_application_testing_parameter_id_key"
  ON "sample_review_parameters"("application_testing_parameter_id");
CREATE INDEX "sample_review_parameters_sample_review_id_decision_idx"
  ON "sample_review_parameters"("sample_review_id", "decision");

CREATE UNIQUE INDEX "testing_work_orders_work_order_number_key"
  ON "testing_work_orders"("work_order_number");
CREATE UNIQUE INDEX "testing_work_orders_application_testing_parameter_id_key"
  ON "testing_work_orders"("application_testing_parameter_id");
CREATE INDEX "testing_work_orders_testing_application_id_type_status_idx"
  ON "testing_work_orders"("testing_application_id", "type", "status");
CREATE INDEX "testing_work_orders_analyst_id_status_deleted_at_idx"
  ON "testing_work_orders"("analyst_id", "status", "deleted_at");
CREATE INDEX "testing_work_orders_partner_laboratory_id_status_idx"
  ON "testing_work_orders"("partner_laboratory_id", "status");

CREATE INDEX "testing_work_order_documents_testing_work_order_id_type_deleted_at_idx"
  ON "testing_work_order_documents"("testing_work_order_id", "type", "deleted_at");
CREATE INDEX "testing_work_order_documents_uploaded_by_id_idx"
  ON "testing_work_order_documents"("uploaded_by_id");
