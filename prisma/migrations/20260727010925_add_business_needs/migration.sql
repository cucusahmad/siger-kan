-- CreateEnum
CREATE TYPE "BusinessNeedStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateTable
CREATE TABLE "business_needs" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "commodity_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "unit_id" BIGINT NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT NOT NULL,
    "specifications" TEXT,
    "quantity" DECIMAL(18,2) NOT NULL,
    "minimum_budget" DECIMAL(18,2),
    "maximum_budget" DECIMAL(18,2),
    "is_budget_negotiable" BOOLEAN NOT NULL DEFAULT false,
    "delivery_location" VARCHAR(300) NOT NULL,
    "required_at" DATE,
    "status" "BusinessNeedStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(3),
    "closed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "business_needs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_needs_business_id_status_deleted_at_idx" ON "business_needs"("business_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "business_needs_commodity_id_status_required_at_deleted_at_idx" ON "business_needs"("commodity_id", "status", "required_at", "deleted_at");

-- CreateIndex
CREATE INDEX "business_needs_category_id_status_deleted_at_idx" ON "business_needs"("category_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "business_needs_unit_id_idx" ON "business_needs"("unit_id");

-- AddForeignKey
ALTER TABLE "business_needs" ADD CONSTRAINT "business_needs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_needs" ADD CONSTRAINT "business_needs_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "commodities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_needs" ADD CONSTRAINT "business_needs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_needs" ADD CONSTRAINT "business_needs_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "application_testing_parameters_testing_application_id_testing_s" RENAME TO "application_testing_parameters_testing_application_id_testi_key";

-- RenameIndex
ALTER INDEX "testing_work_order_documents_testing_work_order_id_type_deleted" RENAME TO "testing_work_order_documents_testing_work_order_id_type_del_idx";
