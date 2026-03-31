'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  UserPlus, 
  Mail, 
  Loader2, 
  Check, 
  X,
  TrendingUp,
  TrendingDown,
  Crown,
  User,
  Clock,
  Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

interface Member {
  id: string
  profile_id: string
  role: string
  profiles: {
    id: string
    display_name: string
    avatar_url: string | null
  }
  income: number
  expenses: number
}

interface Invitation {
  id: string
  invited_email: string
  status: string
  created_at: string
  expires_at: string
}

export default function HouseholdPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [householdName, setHouseholdName] = useState('')
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [currency, setCurrency] = useState('JPY')
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get household membership
    const { data: membership } = await supabase
      .from('household_members')
      .select('*, households(*)')
      .eq('profile_id', user.id)
      .single() as { data: { household_id: string; role: string; households: { name: string; currency: string } | null } | null }

    if (!membership) {
      setLoading(false)
      return
    }

    setHouseholdId(membership.household_id)
    setHouseholdName(membership.households?.name || 'My Household')
    setCurrency(membership.households?.currency || 'JPY')
    console.log('Membership role:', membership.role) // Debug
    setIsOwner(membership.role === 'owner')

    // Get all household members with their profiles
    const { data: membersData } = await supabase
      .from('household_members')
      .select('*, profiles(*)')
      .eq('household_id', membership.household_id) as { data: Array<{ id: string; profile_id: string; role: string; profiles: { id: string; display_name: string; avatar_url: string | null } | null }> | null }

    // Get transactions for this month to calculate income/expenses per member
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, accounts!inner(household_id)')
      .eq('accounts.household_id', membership.household_id)
      .gte('txn_date', startOfMonth.toISOString().split('T')[0])

    // Calculate income/expenses per member
    const membersWithStats = (membersData || []).map(member => {
      const memberTransactions = (transactions || []).filter(
        t => t.created_by === member.profile_id
      )
      const income = memberTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      const expenses = memberTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      return {
        ...member,
        income,
        expenses
      }
    })

    setMembers(membersWithStats)

    // Get pending invitations (only for owners)
    if (membership.role === 'owner') {
      const { data: invitationsData } = await supabase
        .from('household_invitations')
        .select('*')
        .eq('household_id', membership.household_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      setInvitations(invitationsData || [])
    }

    setLoading(false)
  }

  const handleInvite = async () => {
    if (!inviteEmail || !householdId) return

    setInviteLoading(true)
    setInviteError(null)

    const { data: { user } } = await supabase.auth.getUser()

    // Check if already a member
    const existingMember = members.find(m => 
      m.profiles?.display_name?.toLowerCase().includes(inviteEmail.toLowerCase())
    )
    if (existingMember) {
      setInviteError('This person is already a member')
      setInviteLoading(false)
      return
    }

    // Check if already invited
    const existingInvite = invitations.find(i => 
      i.invited_email.toLowerCase() === inviteEmail.toLowerCase()
    )
    if (existingInvite) {
      setInviteError('An invitation has already been sent to this email')
      setInviteLoading(false)
      return
    }

    // Create invitation
    const { error } = await supabase
      .from('household_invitations')
      .insert({
        household_id: householdId,
        invited_email: inviteEmail,
        invited_by: user?.id
      })

    if (error) {
      setInviteError(error.message)
      setInviteLoading(false)
      return
    }

    // TODO: Send email notification via Supabase Edge Function or external service

    setInviteSuccess(true)
    setInviteLoading(false)

    setTimeout(() => {
      setInviteSuccess(false)
      setInviteEmail('')
      setDialogOpen(false)
      loadData()
    }, 2000)
  }

  const cancelInvitation = async (invitationId: string) => {
    await supabase
      .from('household_invitations')
      .update({ status: 'expired' })
      .eq('id', invitationId)

    loadData()
  }

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || '?'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-success" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-navy-900">{householdName}</h1>
          <p className="text-sm text-gray-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-success hover:bg-success/90 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite to Household</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your household. They'll receive a notification when they log in.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {inviteError && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                    {inviteError}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="partner@gmail.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleInvite}
                  disabled={!inviteEmail || inviteLoading}
                  className="w-full bg-success hover:bg-success/90"
                >
                  {inviteLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : inviteSuccess ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Invitation Sent!
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  The invitation will expire in 7 days
                </p>
              </div>
            </DialogContent>
          </Dialog>
      </div>

      {/* Members Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {members.map((member) => (
          <Card key={member.id} className="border border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src={member.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-navy-100 text-navy-900 font-medium">
                    {getInitials(member.profiles?.display_name || '')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-navy-900 truncate">
                      {member.profiles?.display_name || 'Unknown'}
                    </h3>
                    {member.role === 'owner' && (
                      <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                </div>
              </div>

              {/* This Month Stats */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-3">This Month</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Income</p>
                      <p className="text-sm font-semibold text-success">
                        {formatCurrency(member.income, currency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expenses</p>
                      <p className="text-sm font-semibold text-red-500">
                        {formatCurrency(member.expenses, currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Invitations */}
      {isOwner && invitations.length > 0 && (
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-navy-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div 
                  key={invitation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-navy-900">{invitation.invited_email}</p>
                      <p className="text-xs text-gray-500">
                        Expires {new Date(invitation.expires_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelInvitation(invitation.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Household Summary */}
      <Card className="border border-gray-200 bg-gradient-to-br from-navy-900 to-navy-950 text-white">
        <CardContent className="p-5">
          <h3 className="text-sm text-gray-400 mb-4">Household Total (This Month)</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-400">Total Income</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(members.reduce((sum, m) => sum + m.income, 0), currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Expenses</p>
              <p className="text-2xl font-bold text-red-400">
                {formatCurrency(members.reduce((sum, m) => sum + m.expenses, 0), currency)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
