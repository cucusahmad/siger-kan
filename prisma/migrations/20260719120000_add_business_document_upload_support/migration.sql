ALTER TYPE "LegalDocumentType" ADD VALUE IF NOT EXISTS 'PIRT';
ALTER TYPE "LegalDocumentType" ADD VALUE IF NOT EXISTS 'PIC_IDENTITY';

ALTER TABLE "business_legal_documents"
ADD COLUMN "file_extension" VARCHAR(10),
ADD COLUMN "storage_provider" VARCHAR(40) NOT NULL DEFAULT 'LOCAL',
ADD COLUMN "uploaded_by_user_id" BIGINT;

UPDATE "business_legal_documents"
SET "file_extension" = CASE
  WHEN LOWER("original_file_name") LIKE '%.jpeg' THEN '.jpeg'
  WHEN LOWER("original_file_name") LIKE '%.jpg' THEN '.jpg'
  WHEN LOWER("original_file_name") LIKE '%.png' THEN '.png'
  ELSE '.pdf'
END
WHERE "file_extension" IS NULL;

ALTER TABLE "business_legal_documents"
ALTER COLUMN "file_extension" SET NOT NULL;

CREATE INDEX "business_legal_documents_uploaded_by_user_id_idx"
ON "business_legal_documents"("uploaded_by_user_id");

ALTER TABLE "business_legal_documents"
ADD CONSTRAINT "business_legal_documents_uploaded_by_user_id_fkey"
FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
