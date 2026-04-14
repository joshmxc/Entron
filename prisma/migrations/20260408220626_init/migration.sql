-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "GuestType" AS ENUM ('SINGLE', 'DOUBLE', 'FAMILY', 'VIP');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('SUCCESS', 'ALREADY_SCANNED', 'INVALID_QR', 'WRONG_EVENT', 'LIMIT_REACHED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MPESA', 'AIRTEL', 'TIGO_PESA', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('WHATSAPP', 'SMS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'sw',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_swahili" TEXT,
    "description" TEXT,
    "venue" TEXT NOT NULL,
    "venue_swahili" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "banner_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "table_number" TEXT,
    "seat_number" TEXT,
    "guest_type" "GuestType" NOT NULL DEFAULT 'SINGLE',
    "max_admissions" INTEGER NOT NULL DEFAULT 1,
    "admissions_used" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "qr_code" TEXT NOT NULL,
    "qr_image_url" TEXT,
    "is_checked_in" BOOLEAN NOT NULL DEFAULT false,
    "checked_in_at" TIMESTAMP(3),
    "import_batch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "row_count" INTEGER NOT NULL,
    "imported_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scans" (
    "id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "status" "ScanStatus" NOT NULL,
    "admission_count" INTEGER NOT NULL DEFAULT 1,
    "device_info" TEXT,
    "synced_from_offline" BOOLEAN NOT NULL DEFAULT false,
    "original_timestamp" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation_templates" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitation_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_invitations" (
    "id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "card_url" TEXT,
    "channel" "MessageChannel" NOT NULL DEFAULT 'WHATSAPP',
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "message_id" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_messages" (
    "id" TEXT NOT NULL,
    "sent_by" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL DEFAULT 'WHATSAPP',
    "external_id" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbound_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "guest_id" TEXT,
    "phone" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "external_ref" TEXT,
    "provider_ref" TEXT,
    "callback_payload" JSONB,
    "description" TEXT,
    "initiated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_sync_logs" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "synced" INTEGER NOT NULL,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offline_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "guests_qr_code_key" ON "guests"("qr_code");

-- CreateIndex
CREATE INDEX "guests_event_id_idx" ON "guests"("event_id");

-- CreateIndex
CREATE INDEX "guests_qr_code_idx" ON "guests"("qr_code");

-- CreateIndex
CREATE INDEX "guests_phone_idx" ON "guests"("phone");

-- CreateIndex
CREATE INDEX "scans_event_id_created_at_idx" ON "scans"("event_id", "created_at");

-- CreateIndex
CREATE INDEX "scans_staff_id_idx" ON "scans"("staff_id");

-- CreateIndex
CREATE INDEX "scans_guest_id_idx" ON "scans"("guest_id");

-- CreateIndex
CREATE INDEX "guest_invitations_guest_id_idx" ON "guest_invitations"("guest_id");

-- CreateIndex
CREATE INDEX "guest_invitations_status_idx" ON "guest_invitations"("status");

-- CreateIndex
CREATE INDEX "outbound_messages_phone_idx" ON "outbound_messages"("phone");

-- CreateIndex
CREATE INDEX "payments_event_id_idx" ON "payments"("event_id");

-- CreateIndex
CREATE INDEX "payments_external_ref_idx" ON "payments"("external_ref");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_invitations" ADD CONSTRAINT "guest_invitations_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_invitations" ADD CONSTRAINT "guest_invitations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "invitation_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_messages" ADD CONSTRAINT "outbound_messages_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
