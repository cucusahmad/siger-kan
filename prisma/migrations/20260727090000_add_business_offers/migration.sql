-- CreateEnum
CREATE TYPE "BusinessOfferStatus" AS ENUM ('SUBMITTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "business_offers" (
    "id" BIGSERIAL NOT NULL,
    "business_need_id" BIGINT NOT NULL,
    "supplier_business_id" BIGINT NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "lead_time_days" INTEGER NOT NULL,
    "valid_until" DATE NOT NULL,
    "message" TEXT NOT NULL,
    "status" "BusinessOfferStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMPTZ(3),
    "response_notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "business_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_offers_business_need_id_supplier_business_id_key" ON "business_offers"("business_need_id", "supplier_business_id");

-- CreateIndex
CREATE INDEX "business_offers_supplier_business_id_status_deleted_at_idx" ON "business_offers"("supplier_business_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "business_offers_business_need_id_status_deleted_at_idx" ON "business_offers"("business_need_id", "status", "deleted_at");

-- AddForeignKey
ALTER TABLE "business_offers" ADD CONSTRAINT "business_offers_business_need_id_fkey" FOREIGN KEY ("business_need_id") REFERENCES "business_needs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_offers" ADD CONSTRAINT "business_offers_supplier_business_id_fkey" FOREIGN KEY ("supplier_business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
