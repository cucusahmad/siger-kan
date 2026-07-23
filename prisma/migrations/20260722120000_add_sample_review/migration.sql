ALTER TYPE "TestingApplicationStatus" ADD VALUE 'KAJI_ULANG';

CREATE TYPE "SampleReviewDecision" AS ENUM ('DAPAT_DIUJI_INTERNAL', 'SUBKONTRAK');

CREATE TABLE "sample_reviews" (
  "id" BIGSERIAL PRIMARY KEY,
  "testing_application_id" BIGINT NOT NULL,
  "personnel_ready" BOOLEAN NOT NULL,
  "equipment_ready" BOOLEAN NOT NULL,
  "method_available" BOOLEAN NOT NULL,
  "laboratory_capable" BOOLEAN NOT NULL,
  "subcontract_required" BOOLEAN NOT NULL,
  "decision" "SampleReviewDecision" NOT NULL,
  "notes" TEXT,
  "reviewed_by_id" BIGINT NOT NULL,
  "reviewed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "sample_reviews_testing_application_id_fkey" FOREIGN KEY ("testing_application_id") REFERENCES "testing_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "sample_reviews_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "sample_reviews_testing_application_id_key" ON "sample_reviews"("testing_application_id");
CREATE INDEX "sample_reviews_decision_reviewed_at_idx" ON "sample_reviews"("decision", "reviewed_at");
CREATE INDEX "sample_reviews_reviewed_by_id_idx" ON "sample_reviews"("reviewed_by_id");
