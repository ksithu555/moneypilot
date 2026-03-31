-- Fix RLS infinite recursion issue
-- Run this FIRST before the add_invitations.sql migration

-- Drop existing problematic policies on household_members
DROP POLICY IF EXISTS "Users can view household members" ON household_members;
DROP POLICY IF EXISTS "Users can view their memberships" ON household_members;
DROP POLICY IF EXISTS "Owners can manage household members" ON household_members;
DROP POLICY IF EXISTS "Service role can insert household members" ON household_members;

-- Recreate policies without recursion
-- Users can view their own membership record
CREATE POLICY "Users can view own membership" ON household_members
  FOR SELECT USING (profile_id = auth.uid());

-- Users can view other members in same household (using a direct join approach)
CREATE POLICY "Users can view household members" ON household_members
  FOR SELECT USING (
    household_id IN (
      SELECT hm.household_id 
      FROM household_members hm 
      WHERE hm.profile_id = auth.uid()
    )
  );

-- Owners can insert new members
CREATE POLICY "Owners can add members" ON household_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_id
      AND hm.profile_id = auth.uid()
      AND hm.role = 'owner'
    )
  );

-- Owners can delete members (except themselves)
CREATE POLICY "Owners can remove members" ON household_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_id
      AND hm.profile_id = auth.uid()
      AND hm.role = 'owner'
    )
    AND profile_id != auth.uid()
  );

-- Service role bypass for triggers
CREATE POLICY "Service role can insert members" ON household_members
  FOR INSERT TO service_role WITH CHECK (true);

-- Also fix households table if needed
DROP POLICY IF EXISTS "Users can view their households" ON households;

CREATE POLICY "Users can view their households" ON households
  FOR SELECT USING (
    id IN (
      SELECT household_id FROM household_members WHERE profile_id = auth.uid()
    )
  );
