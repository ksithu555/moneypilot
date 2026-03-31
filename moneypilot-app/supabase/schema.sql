-- MoneyPilot Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING OBJECTS (for clean re-run)
-- ============================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_household_created ON households;
DROP TRIGGER IF EXISTS on_transaction_change ON transactions;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_household() CASCADE;
DROP FUNCTION IF EXISTS public.update_account_balance() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_categories(UUID) CASCADE;

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS household_members CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS households CASCADE;

-- ============================================
-- CORE TABLES
-- ============================================

-- Households table (root of all data)
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'JPY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Household members (links profiles to households)
CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(household_id, profile_id)
);

-- Accounts table
-- Types: checking (bank), savings, credit (credit card debt), cash, investment (NISA, stocks), loan, gold
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'cash', 'investment', 'loan', 'gold')),
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'JPY',
  institution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT NOT NULL DEFAULT '#6b7280',
  icon TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Receipts table (for camera input)
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  raw_ocr JSONB,
  parse_status TEXT NOT NULL DEFAULT 'pending' CHECK (parse_status IN ('pending', 'processing', 'completed', 'failed')),
  parsed_data JSONB,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  txn_date DATE NOT NULL,
  note TEXT,
  payee TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_rule JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(15, 2) NOT NULL,
  saved_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  target_date DATE,
  color TEXT NOT NULL DEFAULT '#10b981',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Insights cache table
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('judgement', 'suggestion', 'forecast')),
  data JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Household invitations table
CREATE TABLE household_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  responded_at TIMESTAMPTZ,
  UNIQUE(household_id, invited_email, status)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_household_members_household ON household_members(household_id);
CREATE INDEX idx_household_members_profile ON household_members(profile_id);
CREATE INDEX idx_accounts_household ON accounts(household_id);
CREATE INDEX idx_categories_household ON categories(household_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(txn_date);
CREATE INDEX idx_receipts_household ON receipts(household_id);
CREATE INDEX idx_goals_household ON goals(household_id);
CREATE INDEX idx_ai_insights_household ON ai_insights(household_id);
CREATE INDEX idx_invitations_household ON household_invitations(household_id);
CREATE INDEX idx_invitations_email ON household_invitations(invited_email);
CREATE INDEX idx_invitations_status ON household_invitations(status);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to insert profiles (for trigger)
CREATE POLICY "Service role can insert profiles" ON profiles
  FOR INSERT TO service_role WITH CHECK (true);

-- Household members: Users can see members of their households
CREATE POLICY "Users can view household members" ON household_members
  FOR SELECT USING (
    profile_id = auth.uid() OR
    household_id IN (
      SELECT household_id FROM household_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage household members" ON household_members
  FOR ALL USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE profile_id = auth.uid() AND role = 'owner'
    )
  );

-- Allow service role to insert household members (for trigger)
CREATE POLICY "Service role can insert household members" ON household_members
  FOR INSERT TO service_role WITH CHECK (true);

-- Households: Users can see households they belong to
CREATE POLICY "Users can view their households" ON households
  FOR SELECT USING (
    id IN (SELECT household_id FROM household_members WHERE profile_id = auth.uid())
  );

CREATE POLICY "Owners can update households" ON households
  FOR UPDATE USING (
    id IN (
      SELECT household_id FROM household_members 
      WHERE profile_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Users can create households" ON households
  FOR INSERT WITH CHECK (true);

-- Allow service role to insert households (for trigger)
CREATE POLICY "Service role can insert households" ON households
  FOR INSERT TO service_role WITH CHECK (true);

-- Invitations: Household owners can manage invitations
CREATE POLICY "Owners can view household invitations" ON household_invitations
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE profile_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can create invitations" ON household_invitations
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE profile_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can update invitations" ON household_invitations
  FOR UPDATE USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE profile_id = auth.uid() AND role = 'owner'
    )
  );

-- Invitees can view and respond to their invitations
CREATE POLICY "Invitees can view their invitations" ON household_invitations
  FOR SELECT USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Invitees can respond to invitations" ON household_invitations
  FOR UPDATE USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  );

-- Accounts: Users can access accounts in their households
CREATE POLICY "Users can view household accounts" ON accounts
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM household_members WHERE profile_id = auth.uid())
  );

CREATE POLICY "Users can manage household accounts" ON accounts
  FOR ALL USING (
    household_id IN (SELECT household_id FROM household_members WHERE profile_id = auth.uid())
  );

-- Categories: Users can access categories in their households
CREATE POLICY "Users can view household categories" ON categories
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM household_members WHERE profile_id = auth.uid())
  );

CREATE POLICY "Users can manage household categories" ON categories
  FOR ALL USING (
    household_id IN (SELECT household_id FROM household_members WHERE profile_id = auth.uid())
  );

-- Transactions: Users can access transactions in their household accounts
CREATE POLICY "Users can view household transactions" ON transactions
  FOR SELECT USING (
    account_id IN (
      SELECT a.id FROM accounts a
      JOIN household_members hm ON a.household_id = hm.household_id
      WHERE hm.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage household transactions" ON transactions
  FOR ALL USING (
    account_id IN (
      SELECT a.id FROM accounts a
      JOIN household_members hm ON a.household_id = hm.household_id
      WHERE hm.profile_id = auth.uid()
    )
  );

-- Receipts: Users can access receipts in their households
CREATE POLICY "Users can view household receipts" ON receipts
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM household_members WHERE profile_id = auth.uid())
  );

CREATE POLICY "Users can manage household receipts" ON receipts
  FOR ALL USING (
    household_id IN (SELECT household_id FROM household_members WHERE profile_id = auth.uid())
  );

-- Goals: Users can access goals in their households
CREATE POLICY "Users can view household goals" ON goals
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM household_members WHERE profile_id = auth.uid())
  );

CREATE POLICY "Users can manage household goals" ON goals
  FOR ALL USING (
    household_id IN (SELECT household_id FROM household_members WHERE profile_id = auth.uid())
  );

-- AI Insights: Users can view insights for their households
CREATE POLICY "Users can view household insights" ON ai_insights
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM household_members WHERE profile_id = auth.uid())
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to create profile on user signup
-- SECURITY DEFINER + SET search_path ensures it runs with elevated privileges
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Insert profile (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- If household_name is provided, create household and membership
  IF NEW.raw_user_meta_data->>'household_name' IS NOT NULL THEN
    -- Create household
    INSERT INTO public.households (name)
    VALUES (NEW.raw_user_meta_data->>'household_name')
    RETURNING id INTO new_household_id;
    
    -- Create membership
    INSERT INTO public.household_members (household_id, profile_id, role)
    VALUES (new_household_id, NEW.id, 'owner');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup (on auth.users table)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update account balance after transaction
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE accounts SET 
      balance = balance + CASE 
        WHEN NEW.type = 'income' THEN NEW.amount 
        WHEN NEW.type = 'expense' THEN -NEW.amount 
        ELSE 0 
      END,
      updated_at = NOW()
    WHERE id = NEW.account_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE accounts SET 
      balance = balance - CASE 
        WHEN OLD.type = 'income' THEN OLD.amount 
        WHEN OLD.type = 'expense' THEN -OLD.amount 
        ELSE 0 
      END,
      updated_at = NOW()
    WHERE id = OLD.account_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Revert old transaction
    UPDATE accounts SET 
      balance = balance - CASE 
        WHEN OLD.type = 'income' THEN OLD.amount 
        WHEN OLD.type = 'expense' THEN -OLD.amount 
        ELSE 0 
      END
    WHERE id = OLD.account_id;
    -- Apply new transaction
    UPDATE accounts SET 
      balance = balance + CASE 
        WHEN NEW.type = 'income' THEN NEW.amount 
        WHEN NEW.type = 'expense' THEN -NEW.amount 
        ELSE 0 
      END,
      updated_at = NOW()
    WHERE id = NEW.account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for transaction balance updates
CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- ============================================
-- DEFAULT CATEGORIES (inserted per household)
-- ============================================

CREATE OR REPLACE FUNCTION public.create_default_categories(p_household_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO categories (household_id, name, type, color, icon, is_default) VALUES
    -- Income categories
    (p_household_id, 'Salary', 'income', '#10b981', 'briefcase', true),
    (p_household_id, 'Bonus', 'income', '#22c55e', 'gift', true),
    (p_household_id, 'Investment Returns', 'income', '#8b5cf6', 'trending-up', true),
    (p_household_id, 'Side Income', 'income', '#3b82f6', 'laptop', true),
    (p_household_id, 'Other Income', 'income', '#6b7280', 'plus-circle', true),
    -- Expense categories
    (p_household_id, 'Daily Expenses', 'expense', '#ef4444', 'coffee', true),
    (p_household_id, 'Food & Dining', 'expense', '#f59e0b', 'utensils', true),
    (p_household_id, 'Groceries', 'expense', '#84cc16', 'shopping-cart', true),
    (p_household_id, 'Shopping', 'expense', '#ec4899', 'shopping-bag', true),
    (p_household_id, 'Transportation', 'expense', '#3b82f6', 'car', true),
    (p_household_id, 'Housing & Rent', 'expense', '#8b5cf6', 'home', true),
    (p_household_id, 'Utilities', 'expense', '#06b6d4', 'zap', true),
    (p_household_id, 'Healthcare', 'expense', '#14b8a6', 'heart', true),
    (p_household_id, 'Entertainment', 'expense', '#f97316', 'film', true),
    (p_household_id, 'Subscriptions', 'expense', '#a855f7', 'repeat', true),
    (p_household_id, 'Credit Card Payment', 'expense', '#dc2626', 'credit-card', true),
    (p_household_id, 'Savings Transfer', 'expense', '#0ea5e9', 'piggy-bank', true),
    (p_household_id, 'Investment (NISA)', 'expense', '#7c3aed', 'trending-up', true),
    (p_household_id, 'Investment (Gold)', 'expense', '#eab308', 'coins', true),
    (p_household_id, 'Other Expenses', 'expense', '#6b7280', 'more-horizontal', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default categories when household is created
CREATE OR REPLACE FUNCTION public.handle_new_household()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.create_default_categories(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_household_created
  AFTER INSERT ON households
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_household();
