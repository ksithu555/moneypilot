-- Migration 003: Fix transactions RLS policy
-- Allow users to insert and view their own transactions

-- Drop existing policies on transactions
DROP POLICY IF EXISTS "Users can view transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage their transactions" ON transactions;

-- Enable RLS on transactions if not already enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON transactions
FOR SELECT
USING (created_by = auth.uid());

-- Policy: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
ON transactions
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Policy: Users can update their own transactions
CREATE POLICY "Users can update own transactions"
ON transactions
FOR UPDATE
USING (created_by = auth.uid());

-- Policy: Users can delete their own transactions
CREATE POLICY "Users can delete own transactions"
ON transactions
FOR DELETE
USING (created_by = auth.uid());
