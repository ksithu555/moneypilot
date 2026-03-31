-- Fix invitations RLS policy
-- Run this to fix the "row-level security policy" error

-- Drop existing policies
DROP POLICY IF EXISTS "Owners can view household invitations" ON household_invitations;
DROP POLICY IF EXISTS "Owners can create invitations" ON household_invitations;
DROP POLICY IF EXISTS "Owners can update invitations" ON household_invitations;
DROP POLICY IF EXISTS "Invitees can view their invitations" ON household_invitations;
DROP POLICY IF EXISTS "Invitees can respond to invitations" ON household_invitations;

-- Simpler policy: Allow authenticated users to insert if they're a member of the household
CREATE POLICY "Members can create invitations" ON household_invitations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND household_id IN (
      SELECT household_id FROM household_members WHERE profile_id = auth.uid()
    )
  );

-- Members can view their household's invitations
CREATE POLICY "Members can view invitations" ON household_invitations
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE profile_id = auth.uid()
    )
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Members can update invitations in their household
CREATE POLICY "Members can update invitations" ON household_invitations
  FOR UPDATE USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE profile_id = auth.uid()
    )
    OR (
      invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND status = 'pending'
    )
  );
