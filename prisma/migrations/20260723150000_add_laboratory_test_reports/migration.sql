CREATE TYPE "LaboratoryTestReportStatus" AS ENUM ('DRAF', 'MENUNGGU_PERSETUJUAN', 'PERLU_PERBAIKAN', 'DITERBITKAN');

CREATE TABLE "laboratory_test_reports" (
    "id" BIGSERIAL NOT NULL,
    "testing_application_id" BIGINT NOT NULL,
    "report_number" VARCHAR(64) NOT NULL,
    "status" "LaboratoryTestReportStatus" NOT NULL DEFAULT 'DRAF',
    "report_date" DATE NOT NULL,
    "conclusion" TEXT NOT NULL,
    "notes" TEXT,
    "prepared_by_id" BIGINT NOT NULL,
    "submitted_at" TIMESTAMPTZ(3),
    "approved_by_id" BIGINT,
    "approved_at" TIMESTAMPTZ(3),
    "approval_notes" TEXT,
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "laboratory_test_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "laboratory_test_reports_testing_application_id_key" ON "laboratory_test_reports"("testing_application_id");
CREATE UNIQUE INDEX "laboratory_test_reports_report_number_key" ON "laboratory_test_reports"("report_number");
CREATE INDEX "laboratory_test_reports_status_submitted_at_idx" ON "laboratory_test_reports"("status", "submitted_at");
CREATE INDEX "laboratory_test_reports_prepared_by_id_idx" ON "laboratory_test_reports"("prepared_by_id");
CREATE INDEX "laboratory_test_reports_approved_by_id_idx" ON "laboratory_test_reports"("approved_by_id");
CREATE INDEX "laboratory_test_reports_published_at_idx" ON "laboratory_test_reports"("published_at");

ALTER TABLE "laboratory_test_reports" ADD CONSTRAINT "laboratory_test_reports_testing_application_id_fkey" FOREIGN KEY ("testing_application_id") REFERENCES "testing_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "laboratory_test_reports" ADD CONSTRAINT "laboratory_test_reports_prepared_by_id_fkey" FOREIGN KEY ("prepared_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "laboratory_test_reports" ADD CONSTRAINT "laboratory_test_reports_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
