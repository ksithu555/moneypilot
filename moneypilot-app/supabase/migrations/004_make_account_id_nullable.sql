-- Migration 004: Make account_id nullable in transactions table
-- This allows transactions without an associated account (since we removed account logic)

ALTER TABLE transactions 
ALTER COLUMN account_id DROP NOT NULL;
