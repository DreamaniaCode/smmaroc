-- CreateSchema
-- Namespace is selected by DATABASE_URL; Prisma creates it during deploy.

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "balance" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "apiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "balance" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lowBalanceLimit" DECIMAL(24,10) NOT NULL DEFAULT 20,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL DEFAULT 10,
    "maxQuantity" INTEGER NOT NULL DEFAULT 100000,
    "ratePer1000" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "sellingRatePer1000" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "dripFeedAllowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_mappings" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "primaryProviderId" TEXT NOT NULL,
    "primaryServiceId" TEXT NOT NULL,
    "backupProviderId" TEXT,
    "backupServiceId" TEXT,
    "autoFailover" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "customerCost" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "clientId" TEXT,
    "serviceId" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 1,
    "intervalMinutes" INTEGER NOT NULL DEFAULT 0,
    "completedRuns" INTEGER NOT NULL DEFAULT 0,
    "currentProviderId" TEXT,
    "providerOrderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startCount" INTEGER,
    "remains" INTEGER,
    "charge" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "failoverAttempted" BOOLEAN NOT NULL DEFAULT false,
    "failoverReason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "sheetRowIndex" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(24,10) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "feeAmount" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(24,10),
    "paymentTiming" TEXT NOT NULL DEFAULT 'STANDARD',
    "proofFilename" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_apiKey_key" ON "users"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "clients_name_key" ON "clients"("name");

-- CreateIndex
CREATE UNIQUE INDEX "service_mappings_serviceId_key" ON "service_mappings"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "service_mappings_primaryProviderId_primaryServiceId_key" ON "service_mappings"("primaryProviderId", "primaryServiceId");

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "orders_userId_createdAt_idx" ON "orders"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "deposits_userId_status_idx" ON "deposits"("userId", "status");

-- CreateIndex
CREATE INDEX "support_requests_userId_idx" ON "support_requests"("userId");

-- AddForeignKey
ALTER TABLE "service_mappings" ADD CONSTRAINT "service_mappings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_mappings" ADD CONSTRAINT "service_mappings_primaryProviderId_fkey" FOREIGN KEY ("primaryProviderId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_mappings" ADD CONSTRAINT "service_mappings_backupProviderId_fkey" FOREIGN KEY ("backupProviderId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_currentProviderId_fkey" FOREIGN KEY ("currentProviderId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

