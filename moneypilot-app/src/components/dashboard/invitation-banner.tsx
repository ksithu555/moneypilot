'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  UserPlus, 
  Check, 
  X, 
  Loader2,
  Users
} from 'lucide-react'

interface Invitation {
  id: string
  household_id: string
  invited_email: string
  status: string
  created_at: string
  expires_at: string
  households: {
    name: string
  }
  inviter: {
    display_name: string
  }
}

export function InvitationBanner() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadInvitations()
  }, [])

  const loadInvitations = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('household_invitations')
      .select(`
        *,
        households(name),
        inviter:profiles!invited_by(display_name)
      `)
      .eq('invited_email', user.email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())

    setInvitations(data || [])
    setLoading(false)
  }

  const respondToInvitation = async (invitationId: string, accept: boolean) => {
    setResponding(invitationId)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const invitation = invitations.find(i => i.id === invitationId)
    if (!invitation) return

    if (accept) {
      // Add user to household
      await supabase
        .from('household_members')
        .insert({
          household_id: invitation.household_id,
          profile_id: user.id,
          role: 'member'
        })
    }

    // Update invitation status
    await supabase
      .from('household_invitations')
      .update({ 
        status: accept ? 'accepted' : 'rejected',
        responded_at: new Date().toISOString()
      })
      .eq('id', invitationId)

    setResponding(null)
    
    if (accept) {
      // Reload page to show new household
      window.location.reload()
    } else {
      loadInvitations()
    }
  }

  if (loading || invitations.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 mb-6">
      {invitations.map((invitation) => (
        <Card key={invitation.id} className="border-2 border-success/30 bg-success/5">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-navy-900">
                    You're invited to join "{invitation.households?.name}"
                  </p>
                  <p className="text-sm text-gray-500">
                    Invited by {invitation.inviter?.display_name || 'a household member'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => respondToInvitation(invitation.id, false)}
                  disabled={responding === invitation.id}
                  className="border-gray-300 text-gray-600"
                >
                  {responding === invitation.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => respondToInvitation(invitation.id, true)}
                  disabled={responding === invitation.id}
                  className="bg-success hover:bg-success/90 text-white"
                >
                  {responding === invitation.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
