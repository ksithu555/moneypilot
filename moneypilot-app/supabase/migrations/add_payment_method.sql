-- Migration: Add payment method and credit tracking to transactions
-- Run this to support credit card debt tracking

-- Add payment_method column (cash or credit)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'credit'));

-- Add is_credit flag for easy debt calculation
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_credit BOOLEAN DEFAULT FALSE;

-- Create index for credit transactions (for debt calculation)
CREATE INDEX IF NOT EXISTS idx_transactions_is_credit ON transactions(is_credit) WHERE is_credit = TRUE;

-- View to calculate total credit card debt (unpaid credit transactions)
-- Credit debt = sum of all credit card expenses that haven't been paid yet
CREATE OR REPLACE VIEW credit_card_debt AS
SELECT 
  a.household_id,
  COALESCE(SUM(CASE WHEN t.is_credit = TRUE AND t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_debt,
  COUNT(CASE WHEN t.is_credit = TRUE AND t.type = 'expense' THEN 1 END) as transaction_count
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id
GROUP BY a.household_id;
