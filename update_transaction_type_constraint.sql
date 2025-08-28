-- This SQL script updates the transactions table to allow 'savings' as a valid type
-- Run this in your Supabase SQL editor

-- First, drop the existing check constraint
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add a new check constraint that includes 'savings'
ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('income', 'expense', 'savings'));

-- Verify the constraint was updated successfully
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'transactions'::regclass 
AND contype = 'c';