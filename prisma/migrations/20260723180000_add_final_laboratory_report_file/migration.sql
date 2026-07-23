ALTER TYPE "LaboratoryTestReportStatus" ADD VALUE 'MENUNGGU_DOKUMEN_FINAL' BEFORE 'DITERBITKAN';

ALTER TABLE "laboratory_test_reports"
ADD COLUMN "final_file_name" VARCHAR(255),
ADD COLUMN "final_file_path" VARCHAR(500),
ADD COLUMN "final_mime_type" VARCHAR(120),
ADD COLUMN "final_file_size" BIGINT,
ADD COLUMN "final_uploaded_by_id" BIGINT,
ADD COLUMN "final_uploaded_at" TIMESTAMPTZ(3);

CREATE INDEX "laboratory_test_reports_final_uploaded_by_id_idx" ON "laboratory_test_reports"("final_uploaded_by_id");
ALTER TABLE "laboratory_test_reports" ADD CONSTRAINT "laboratory_test_reports_final_uploaded_by_id_fkey" FOREIGN KEY ("final_uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
