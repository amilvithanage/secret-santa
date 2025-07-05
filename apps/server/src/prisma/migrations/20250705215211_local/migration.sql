-- CreateEnum
CREATE TYPE "GiftExchangeStatus" AS ENUM ('DRAFT', 'PARTICIPANTS_ADDED', 'ASSIGNED', 'COMPLETED');

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_exchanges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "GiftExchangeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_exchanges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_exchange_participants" (
    "id" TEXT NOT NULL,
    "giftExchangeId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_exchange_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "giftExchangeId" TEXT NOT NULL,
    "giverId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exclusion_rules" (
    "id" TEXT NOT NULL,
    "giftExchangeId" TEXT NOT NULL,
    "excluderId" TEXT NOT NULL,
    "excludedId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exclusion_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "participants_email_key" ON "participants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "gift_exchange_participants_giftExchangeId_participantId_key" ON "gift_exchange_participants"("giftExchangeId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_giftExchangeId_giverId_key" ON "assignments"("giftExchangeId", "giverId");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_giftExchangeId_receiverId_key" ON "assignments"("giftExchangeId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "exclusion_rules_giftExchangeId_excluderId_excludedId_key" ON "exclusion_rules"("giftExchangeId", "excluderId", "excludedId");

-- AddForeignKey
ALTER TABLE "gift_exchange_participants" ADD CONSTRAINT "gift_exchange_participants_giftExchangeId_fkey" FOREIGN KEY ("giftExchangeId") REFERENCES "gift_exchanges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_exchange_participants" ADD CONSTRAINT "gift_exchange_participants_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_giftExchangeId_fkey" FOREIGN KEY ("giftExchangeId") REFERENCES "gift_exchanges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exclusion_rules" ADD CONSTRAINT "exclusion_rules_giftExchangeId_fkey" FOREIGN KEY ("giftExchangeId") REFERENCES "gift_exchanges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exclusion_rules" ADD CONSTRAINT "exclusion_rules_excluderId_fkey" FOREIGN KEY ("excluderId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exclusion_rules" ADD CONSTRAINT "exclusion_rules_excludedId_fkey" FOREIGN KEY ("excludedId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
