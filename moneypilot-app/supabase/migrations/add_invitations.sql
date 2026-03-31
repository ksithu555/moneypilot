-- Migration: Add household invitations table
-- Run this if you already have data and don't want to drop everything

-- Create the invitations table
CREATE TABLE IF NOT EXISTS household_invitations (
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_invitations_household ON household_invitations(household_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON household_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON household_invitations(status);

-- Enable RLS
ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations

-- Owners can view their household invitations
CREATE POLICY "Owners can view household invitations" ON household_invitations
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE profile_id = auth.uid() AND role = 'owner'
    )
  );

-- Owners can create invitations
CREATE POLICY "Owners can create invitations" ON household_invitations
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE profile_id = auth.uid() AND role = 'owner'
    )
  );

-- Owners can update invitations (cancel)
CREATE POLICY "Owners can update invitations" ON household_invitations
  FOR UPDATE USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE profile_id = auth.uid() AND role = 'owner'
    )
  );

-- Invitees can view their own invitations
CREATE POLICY "Invitees can view their invitations" ON household_invitations
  FOR SELECT USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Invitees can respond to their invitations
CREATE POLICY "Invitees can respond to invitations" ON household_invitations
  FOR UPDATE USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  );
