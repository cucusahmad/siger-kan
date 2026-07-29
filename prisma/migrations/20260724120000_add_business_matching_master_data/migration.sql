-- CreateTable
CREATE TABLE "product_categories" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "units" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "description" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" VARCHAR(1000),
    "commodity_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "unit_id" BIGINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_categories_code_key" ON "product_categories"("code");
CREATE UNIQUE INDEX "product_categories_name_key" ON "product_categories"("name");
CREATE INDEX "product_categories_is_active_deleted_at_idx" ON "product_categories"("is_active", "deleted_at");
CREATE UNIQUE INDEX "units_code_key" ON "units"("code");
CREATE UNIQUE INDEX "units_name_key" ON "units"("name");
CREATE INDEX "units_is_active_deleted_at_idx" ON "units"("is_active", "deleted_at");
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");
CREATE UNIQUE INDEX "products_name_commodity_id_key" ON "products"("name", "commodity_id");
CREATE INDEX "products_commodity_id_is_active_deleted_at_idx" ON "products"("commodity_id", "is_active", "deleted_at");
CREATE INDEX "products_category_id_is_active_deleted_at_idx" ON "products"("category_id", "is_active", "deleted_at");
CREATE INDEX "products_unit_id_idx" ON "products"("unit_id");

ALTER TABLE "products" ADD CONSTRAINT "products_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "commodities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
