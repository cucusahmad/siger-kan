-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('INTERNAL_GOVERNMENT', 'EXTERNAL_BUSINESS');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "SystemRoleCode" AS ENUM ('SUPER_ADMIN', 'ADMIN_DINAS', 'KEPALA_DINAS', 'KEPALA_UPTD', 'KASI_PENGUJIAN', 'PETUGAS_REGISTRASI', 'PETUGAS_PENERIMAAN_SAMPEL', 'ANALIS_LAB', 'PENYELIA_LAB', 'PETUGAS_SERTIFIKASI', 'KONSULTAN_MUTU', 'PETUGAS_MONEV', 'PELAKU_USAHA', 'MITRA_BISNIS');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('ACTIVE', 'USED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('FISH_FARMER', 'FISHER', 'PROCESSOR', 'DISTRIBUTOR', 'EXPORTER', 'MSME', 'OTHER');

-- CreateEnum
CREATE TYPE "BusinessMembershipRole" AS ENUM ('OWNER', 'ADMIN', 'QUALITY_MANAGER', 'STAFF', 'VIEWER');

-- CreateEnum
CREATE TYPE "BusinessMembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'LEFT', 'REVOKED');

-- CreateEnum
CREATE TYPE "CommodityPriority" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('NIB', 'BUSINESS_LICENSE', 'TAX_ID', 'COMPANY_DEED', 'DOMICILE_CERTIFICATE', 'HALAL_CERTIFICATE', 'QUALITY_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'APPROVE', 'REJECT', 'STATUS_CHANGE', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'EMAIL_VERIFY', 'ROLE_ASSIGN', 'ROLE_REVOKE', 'PERMISSION_CHANGE', 'SESSION_REVOKE');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "normalized_email" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(32),
    "normalized_phone" VARCHAR(32),
    "password_hash" VARCHAR(255) NOT NULL,
    "type" "UserType" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "email_verified_at" TIMESTAMPTZ(3),
    "password_changed_at" TIMESTAMPTZ(3),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(3),
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "full_name" VARCHAR(160) NOT NULL,
    "employee_number" VARCHAR(64),
    "position_title" VARCHAR(160),
    "agency_id" BIGINT,
    "organizational_unit_id" BIGINT,
    "avatar_storage_key" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "code" "SystemRoleCode" NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(160) NOT NULL,
    "resource" VARCHAR(80) NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "assigned_by_id" BIGINT,
    "assigned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "access_token_hash" VARCHAR(255) NOT NULL,
    "refresh_token_hash" VARCHAR(255) NOT NULL,
    "token_family" VARCHAR(128) NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(500),
    "device_name" VARCHAR(160),
    "last_used_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "revoke_reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "status" "TokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "status" "TokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "government_agencies" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "short_name" VARCHAR(80),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "government_agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizational_units" (
    "id" BIGSERIAL NOT NULL,
    "agency_id" BIGINT NOT NULL,
    "parent_unit_id" BIGINT,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "organizational_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regencies" (
    "id" BIGSERIAL NOT NULL,
    "province_id" BIGINT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "is_city" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "regencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" BIGSERIAL NOT NULL,
    "regency_id" BIGINT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "villages" (
    "id" BIGSERIAL NOT NULL,
    "district_id" BIGINT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "villages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" BIGSERIAL NOT NULL,
    "business_code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "status" "BusinessStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verified_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "business_type" "BusinessType" NOT NULL,
    "business_type_other" VARCHAR(160),
    "nib" VARCHAR(32),
    "tax_number" VARCHAR(64),
    "email" VARCHAR(320),
    "phone" VARCHAR(32),
    "address_line" TEXT,
    "village_id" BIGINT,
    "district_id" BIGINT,
    "regency_id" BIGINT NOT NULL,
    "province_id" BIGINT NOT NULL,
    "postal_code" VARCHAR(10),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "description" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_members" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role" "BusinessMembershipRole" NOT NULL,
    "status" "BusinessMembershipStatus" NOT NULL DEFAULT 'INVITED',
    "invited_by_id" BIGINT,
    "invited_at" TIMESTAMPTZ(3),
    "joined_at" TIMESTAMPTZ(3),
    "ended_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "business_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_legal_documents" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "type" "LegalDocumentType" NOT NULL,
    "document_number" VARCHAR(120),
    "document_name" VARCHAR(200) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "original_file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "checksum" VARCHAR(128) NOT NULL,
    "issued_at" DATE,
    "expires_at" DATE,
    "verification_status" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verified_by_id" BIGINT,
    "verified_at" TIMESTAMPTZ(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "business_legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commodities" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "scientific_name" VARCHAR(180),
    "is_other" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "commodities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_commodities" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "commodity_id" BIGINT NOT NULL,
    "priority" "CommodityPriority" NOT NULL DEFAULT 'SECONDARY',
    "other_description" VARCHAR(200),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "business_commodities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_consents" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "document_version" VARCHAR(40) NOT NULL,
    "accepted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMPTZ(3),
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "actor_user_id" BIGINT,
    "business_id" BIGINT,
    "action" "AuditAction" NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(100),
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(500),
    "previous_value" JSONB,
    "new_value" JSONB,
    "metadata" JSONB,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_normalized_email_key" ON "users"("normalized_email");

-- CreateIndex
CREATE UNIQUE INDEX "users_normalized_phone_key" ON "users"("normalized_phone");

-- CreateIndex
CREATE INDEX "users_status_deleted_at_idx" ON "users"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "users_type_status_idx" ON "users"("type", "status");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_profiles_full_name_idx" ON "user_profiles"("full_name");

-- CreateIndex
CREATE INDEX "user_profiles_employee_number_idx" ON "user_profiles"("employee_number");

-- CreateIndex
CREATE INDEX "user_profiles_agency_id_idx" ON "user_profiles"("agency_id");

-- CreateIndex
CREATE INDEX "user_profiles_organizational_unit_id_idx" ON "user_profiles"("organizational_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "roles_is_active_deleted_at_idx" ON "roles"("is_active", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_is_active_deleted_at_idx" ON "permissions"("is_active", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "user_roles_user_id_revoked_at_expires_at_idx" ON "user_roles"("user_id", "revoked_at", "expires_at");

-- CreateIndex
CREATE INDEX "user_roles_role_id_revoked_at_idx" ON "user_roles"("role_id", "revoked_at");

-- CreateIndex
CREATE INDEX "user_roles_assigned_by_id_idx" ON "user_roles"("assigned_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_access_token_hash_key" ON "user_sessions"("access_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refresh_token_hash_key" ON "user_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_status_idx" ON "user_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_sessions_token_family_status_idx" ON "user_sessions"("token_family", "status");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_status_idx" ON "user_sessions"("expires_at", "status");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_user_id_status_idx" ON "email_verification_tokens"("user_id", "status");

-- CreateIndex
CREATE INDEX "email_verification_tokens_expires_at_status_idx" ON "email_verification_tokens"("expires_at", "status");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_status_idx" ON "password_reset_tokens"("user_id", "status");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_at_status_idx" ON "password_reset_tokens"("expires_at", "status");

-- CreateIndex
CREATE UNIQUE INDEX "government_agencies_code_key" ON "government_agencies"("code");

-- CreateIndex
CREATE INDEX "government_agencies_name_idx" ON "government_agencies"("name");

-- CreateIndex
CREATE INDEX "government_agencies_is_active_deleted_at_idx" ON "government_agencies"("is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "organizational_units_agency_id_is_active_deleted_at_idx" ON "organizational_units"("agency_id", "is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "organizational_units_parent_unit_id_idx" ON "organizational_units"("parent_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizational_units_agency_id_code_key" ON "organizational_units"("agency_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_code_key" ON "provinces"("code");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_name_key" ON "provinces"("name");

-- CreateIndex
CREATE INDEX "provinces_is_active_idx" ON "provinces"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "regencies_code_key" ON "regencies"("code");

-- CreateIndex
CREATE INDEX "regencies_province_id_is_active_idx" ON "regencies"("province_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "regencies_province_id_name_key" ON "regencies"("province_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "districts_code_key" ON "districts"("code");

-- CreateIndex
CREATE INDEX "districts_regency_id_is_active_idx" ON "districts"("regency_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "districts_regency_id_name_key" ON "districts"("regency_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "villages_code_key" ON "villages"("code");

-- CreateIndex
CREATE INDEX "villages_district_id_is_active_idx" ON "villages"("district_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "villages_district_id_name_key" ON "villages"("district_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_business_code_key" ON "businesses"("business_code");

-- CreateIndex
CREATE INDEX "businesses_name_idx" ON "businesses"("name");

-- CreateIndex
CREATE INDEX "businesses_status_deleted_at_idx" ON "businesses"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "businesses_created_at_idx" ON "businesses"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_business_id_key" ON "business_profiles"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_nib_key" ON "business_profiles"("nib");

-- CreateIndex
CREATE INDEX "business_profiles_business_type_idx" ON "business_profiles"("business_type");

-- CreateIndex
CREATE INDEX "business_profiles_province_id_regency_id_idx" ON "business_profiles"("province_id", "regency_id");

-- CreateIndex
CREATE INDEX "business_profiles_district_id_idx" ON "business_profiles"("district_id");

-- CreateIndex
CREATE INDEX "business_profiles_village_id_idx" ON "business_profiles"("village_id");

-- CreateIndex
CREATE INDEX "business_members_user_id_status_deleted_at_idx" ON "business_members"("user_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "business_members_business_id_status_role_idx" ON "business_members"("business_id", "status", "role");

-- CreateIndex
CREATE INDEX "business_members_invited_by_id_idx" ON "business_members"("invited_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_members_business_id_user_id_key" ON "business_members"("business_id", "user_id");

-- CreateIndex
CREATE INDEX "business_legal_documents_business_id_type_deleted_at_idx" ON "business_legal_documents"("business_id", "type", "deleted_at");

-- CreateIndex
CREATE INDEX "business_legal_documents_verification_status_created_at_idx" ON "business_legal_documents"("verification_status", "created_at");

-- CreateIndex
CREATE INDEX "business_legal_documents_document_number_idx" ON "business_legal_documents"("document_number");

-- CreateIndex
CREATE INDEX "business_legal_documents_verified_by_id_idx" ON "business_legal_documents"("verified_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "commodities_code_key" ON "commodities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "commodities_name_key" ON "commodities"("name");

-- CreateIndex
CREATE INDEX "commodities_is_active_deleted_at_idx" ON "commodities"("is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "business_commodities_commodity_id_idx" ON "business_commodities"("commodity_id");

-- CreateIndex
CREATE INDEX "business_commodities_business_id_priority_deleted_at_idx" ON "business_commodities"("business_id", "priority", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "business_commodities_business_id_commodity_id_key" ON "business_commodities"("business_id", "commodity_id");

-- CreateIndex
CREATE INDEX "user_consents_type_document_version_idx" ON "user_consents"("type", "document_version");

-- CreateIndex
CREATE UNIQUE INDEX "user_consents_user_id_type_document_version_key" ON "user_consents"("user_id", "type", "document_version");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_occurred_at_idx" ON "audit_logs"("actor_user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_logs_business_id_occurred_at_idx" ON "audit_logs"("business_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_occurred_at_idx" ON "audit_logs"("entity_type", "entity_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_occurred_at_idx" ON "audit_logs"("action", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_logs_occurred_at_idx" ON "audit_logs"("occurred_at");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "government_agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_organizational_unit_id_fkey" FOREIGN KEY ("organizational_unit_id") REFERENCES "organizational_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "government_agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_parent_unit_id_fkey" FOREIGN KEY ("parent_unit_id") REFERENCES "organizational_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regencies" ADD CONSTRAINT "regencies_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_regency_id_fkey" FOREIGN KEY ("regency_id") REFERENCES "regencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "villages" ADD CONSTRAINT "villages_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_regency_id_fkey" FOREIGN KEY ("regency_id") REFERENCES "regencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_legal_documents" ADD CONSTRAINT "business_legal_documents_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_legal_documents" ADD CONSTRAINT "business_legal_documents_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_commodities" ADD CONSTRAINT "business_commodities_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_commodities" ADD CONSTRAINT "business_commodities_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "commodities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
