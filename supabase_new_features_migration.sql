-- Migration: Add new fields for pricing, inventory management, and invitations
-- Run this in Supabase SQL Editor

-- 1. Add total property price
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "totalPrice" DOUBLE PRECISION;

-- 2. Add inventory management fields
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "lowStockThreshold" INTEGER DEFAULT 10;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "reminderEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "nextReminderDate" TIMESTAMPTZ;

-- 3. Add invitedBy to Invitation table (if not exists)
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "invitedBy" TEXT;

-- 4. Create index for faster queries
CREATE INDEX IF NOT EXISTS "idx_inventory_low_stock" ON "InventoryItem"("quantity", "lowStockThreshold") 
WHERE "quantity" <= "lowStockThreshold";

CREATE INDEX IF NOT EXISTS "idx_inventory_reminder" ON "InventoryItem"("reminderEnabled", "nextReminderDate") 
WHERE "reminderEnabled" = true;

-- 5. Add comments for documentation
COMMENT ON COLUMN "Property"."totalPrice" IS 'Price for booking the entire property';
COMMENT ON COLUMN "InventoryItem"."lowStockThreshold" IS 'Quantity threshold for low-stock notifications';
COMMENT ON COLUMN "InventoryItem"."reminderEnabled" IS 'Whether reminders are enabled for this item';
COMMENT ON COLUMN "InventoryItem"."nextReminderDate" IS 'Next scheduled reminder date';
