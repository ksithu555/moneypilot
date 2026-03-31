'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Bell, Search, Wallet } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface HeaderProps {
  user: any
  member: any
}

export function Header({ user, member }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = member?.profiles?.display_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex h-14 lg:h-16 items-center justify-between px-4 lg:px-6">
        {/* Left - Logo on mobile, Search on desktop */}
        <div className="flex items-center gap-3">
          <div className="lg:hidden flex items-center gap-2">
            <Wallet className="h-6 w-6 text-success" />
            <span className="text-lg font-bold text-navy-900">Moneypilot</span>
          </div>
          
          {/* Search - Desktop only */}
          <div className="hidden lg:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search transactions..." 
                className="w-64 pl-9 h-10 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Right - Notifications & User */}
        <div className="flex items-center gap-2 lg:gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-navy-900">
            <Bell className="h-5 w-5" />
          </Button>
          
          <div className="hidden lg:block h-6 w-px bg-gray-200" />
          
          <div className="flex items-center gap-2 lg:gap-3">
            <Avatar className="h-8 w-8 lg:h-9 lg:w-9 border-2 border-success/20">
              <AvatarImage src={member?.profiles?.avatar_url} />
              <AvatarFallback className="bg-success/10 text-success font-medium text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-navy-900">
                {member?.profiles?.display_name || user?.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">{member?.role || 'Member'}</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSignOut}
            className="h-9 w-9 text-gray-500 hover:text-red-500 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
