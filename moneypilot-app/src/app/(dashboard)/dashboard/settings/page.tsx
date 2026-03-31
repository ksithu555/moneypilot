'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  User,
  Home,
  LogOut,
  Loader2,
  Check,
  Users,
  Trash2,
  AlertTriangle,
  Key,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Member {
  id: string
  role: string
  profiles: {
    id: string
    display_name: string | null
    email: string
  }
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Profile
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  
  // Household
  const [householdId, setHouseholdId] = useState('')
  const [householdName, setHouseholdName] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [isOwner, setIsOwner] = useState(false)
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)
    setEmail(user.email || '')

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single() as { data: { display_name: string | null } | null }

    if (profile) {
      setDisplayName(profile.display_name || '')
    }

    // Get household membership
    const { data: membership } = await supabase
      .from('household_members')
      .select('household_id, role, households(name)')
      .eq('profile_id', user.id)
      .single() as { data: { household_id: string; role: string; households: { name: string } | null } | null }

    if (membership) {
      setHouseholdId(membership.household_id)
      setHouseholdName(membership.households?.name || '')
      setIsOwner(membership.role === 'owner')

      // Get all members
      const { data: allMembers } = await supabase
        .from('household_members')
        .select('id, role, profiles(id, display_name, email)')
        .eq('household_id', membership.household_id) as { data: Member[] | null }

      if (allMembers) {
        setMembers(allMembers)
      }
    }

    setLoading(false)
  }

  const saveProfile = async () => {
    setSaving(true)

    await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', userId)

    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  const saveHousehold = async () => {
    if (!isOwner) return
    setSaving(true)

    await supabase
      .from('households')
      .update({ name: householdName })
      .eq('id', householdId)

    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  const removeMember = async (memberId: string, memberUserId: string) => {
    if (!isOwner) return
    if (memberUserId === userId) {
      alert("You can't remove yourself. Transfer ownership first.")
      return
    }
    if (!confirm('Remove this member from household?')) return

    await supabase
      .from('household_members')
      .delete()
      .eq('id', memberId)

    loadSettings()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)

    if (!currentPassword) {
      setPasswordError('Please enter your current password')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setChangingPassword(true)

    // First verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: currentPassword
    })

    if (signInError) {
      setChangingPassword(false)
      setPasswordError('Current password is incorrect')
      return
    }

    // Now update to new password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    setChangingPassword(false)

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-success" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl lg:text-2xl font-bold text-navy-900">Settings</h1>

      {/* Profile Section */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-success" />
            </div>
            <div>
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-gray-500">Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-gray-500">Email</Label>
            <Input
              value={email}
              disabled
              className="mt-1 bg-gray-50"
            />
          </div>
          <Button 
            onClick={saveProfile}
            disabled={saving}
            className="bg-success hover:bg-success/90"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : success ? (
              <Check className="h-4 w-4 mr-2" />
            ) : null}
            {success ? 'Saved!' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Household Section */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Home className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Household</CardTitle>
              <CardDescription>Manage your household</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-gray-500">Household Name</Label>
            <Input
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="My Household"
              disabled={!isOwner}
              className={cn("mt-1", !isOwner && "bg-gray-50")}
            />
            {!isOwner && (
              <p className="text-xs text-gray-400 mt-1">Only owners can edit household name</p>
            )}
          </div>

          {isOwner && (
            <Button 
              onClick={saveHousehold}
              disabled={saving}
              variant="outline"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Household Name
            </Button>
          )}

          {/* Members List */}
          <div className="pt-4 border-t">
            <Label className="text-sm text-gray-500 flex items-center gap-1 mb-3">
              <Users className="h-3 w-3" /> Members ({members.length})
            </Label>
            <div className="space-y-2">
              {members.map((member) => (
                <div 
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-navy-100 text-navy-900 text-sm">
                        {(member.profiles?.display_name || member.profiles?.email || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-navy-900">
                        {member.profiles?.display_name || member.profiles?.email?.split('@')[0]}
                        {member.profiles?.id === userId && (
                          <span className="text-xs text-gray-400 ml-1">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  {isOwner && member.profiles?.id !== userId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMember(member.id, member.profiles?.id)}
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
              <Key className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Change Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Label className="text-sm text-gray-500">Current Password</Label>
            <div className="relative mt-1">
              <Input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-500">New Password</Label>
            <Input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-gray-500">Confirm New Password</Label>
            <Input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="mt-1"
            />
          </div>
          {passwordError && (
            <p className="text-sm text-red-500">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-success">Password changed successfully!</p>
          )}
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword || !confirmPassword}
            className="bg-purple-500 hover:bg-purple-600"
          >
            {changingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Key className="h-4 w-4 mr-2" />
            )}
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Account Section */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Account</CardTitle>
              <CardDescription>Sign out of your account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="text-red-500 border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
