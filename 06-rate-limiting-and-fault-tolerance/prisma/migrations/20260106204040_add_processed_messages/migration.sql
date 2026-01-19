-- CreateTable
CREATE TABLE "ProcessedMessage" (
    "id" SERIAL NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedMessage_messageId_key" ON "ProcessedMessage"("messageId");

-- CreateIndex
CREATE INDEX "ProcessedMessage_processedAt_idx" ON "ProcessedMessage"("processedAt");
