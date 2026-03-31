-- Migration 002: Fix infinite recursion in household_members RLS policy
-- This fixes the "infinite recursion detected in policy" error

-- Drop ALL existing policies on household_members
DROP POLICY IF EXISTS "Users can view their household members" ON household_members;
DROP POLICY IF EXISTS "Users can view household members" ON household_members;
DROP POLICY IF EXISTS "Users can view own membership" ON household_members;
DROP POLICY IF EXISTS "Users can access household members" ON household_members;
DROP POLICY IF EXISTS "household_members_select_policy" ON household_members;

-- Create a security definer function to get user's household_id without triggering RLS
CREATE OR REPLACE FUNCTION get_my_household_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT household_id FROM household_members WHERE profile_id = auth.uid() LIMIT 1;
$$;

-- Create a single simple policy using the function
CREATE POLICY "Users can access household members"
ON household_members
FOR ALL
USING (household_id = get_my_household_id());
