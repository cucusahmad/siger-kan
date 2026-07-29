CREATE TYPE "ProductStatus" AS ENUM (
    'DRAFT',
    'PENDING_VERIFICATION',
    'REVISION_REQUIRED',
    'VERIFIED',
    'REJECTED',
    'INACTIVE'
);

CREATE TYPE "ProductAvailability" AS ENUM (
    'READY_STOCK',
    'PREORDER',
    'SEASONAL',
    'OUT_OF_STOCK'
);

CREATE TYPE "ProductionCapacityPeriod" AS ENUM (
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'YEARLY'
);

CREATE TYPE "ProductMarketScope" AS ENUM (
    'LOCAL',
    'NATIONAL',
    'EXPORT'
);

DROP INDEX "product_categories_name_key";
ALTER TABLE "product_categories"
    ADD COLUMN "parent_id" BIGINT,
    ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "product_categories_parent_id_name_key"
    ON "product_categories"("parent_id", "name");
CREATE INDEX "product_categories_parent_id_sort_order_idx"
    ON "product_categories"("parent_id", "sort_order");

ALTER TABLE "product_categories"
    ADD CONSTRAINT "product_categories_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX "products_code_key";
DROP INDEX "products_name_commodity_id_key";
DROP INDEX "products_commodity_id_is_active_deleted_at_idx";
DROP INDEX "products_category_id_is_active_deleted_at_idx";

ALTER TABLE "products"
    DROP COLUMN "code",
    DROP COLUMN "is_active",
    ADD COLUMN "business_id" BIGINT NOT NULL,
    ADD COLUMN "sku" VARCHAR(80),
    ADD COLUMN "brand_name" VARCHAR(160),
    ADD COLUMN "short_description" VARCHAR(300),
    ALTER COLUMN "description" TYPE TEXT,
    ADD COLUMN "specifications" JSONB,
    ADD COLUMN "packaging" VARCHAR(300),
    ADD COLUMN "storage_instructions" VARCHAR(500),
    ADD COLUMN "shelf_life_days" INTEGER,
    ADD COLUMN "minimum_price" DECIMAL(18,2),
    ADD COLUMN "maximum_price" DECIMAL(18,2),
    ADD COLUMN "currency" CHAR(3) NOT NULL DEFAULT 'IDR',
    ADD COLUMN "is_price_negotiable" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "is_price_visible" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "stock_quantity" DECIMAL(18,2),
    ADD COLUMN "minimum_order_quantity" DECIMAL(18,2),
    ADD COLUMN "production_capacity" DECIMAL(18,2),
    ADD COLUMN "production_capacity_period" "ProductionCapacityPeriod",
    ADD COLUMN "availability" "ProductAvailability" NOT NULL DEFAULT 'READY_STOCK',
    ADD COLUMN "market_scope" "ProductMarketScope" NOT NULL DEFAULT 'LOCAL',
    ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN "is_published" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "verified_at" TIMESTAMPTZ(3),
    ADD COLUMN "verification_notes" VARCHAR(1000);

ALTER TABLE "products"
    ADD CONSTRAINT "products_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "products_business_id_sku_key"
    ON "products"("business_id", "sku");
CREATE INDEX "products_business_id_status_deleted_at_idx"
    ON "products"("business_id", "status", "deleted_at");
CREATE INDEX "products_commodity_id_is_published_status_deleted_at_idx"
    ON "products"("commodity_id", "is_published", "status", "deleted_at");
CREATE INDEX "products_category_id_is_published_status_deleted_at_idx"
    ON "products"("category_id", "is_published", "status", "deleted_at");

CREATE TABLE "product_images" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "alt_text" VARCHAR(200),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_images_product_id_is_primary_sort_order_deleted_at_idx"
    ON "product_images"("product_id", "is_primary", "sort_order", "deleted_at");

ALTER TABLE "product_images"
    ADD CONSTRAINT "product_images_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
