import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { InvitationBanner } from '@/components/dashboard/invitation-banner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: member } = await supabase
    .from('household_members')
    .select('*, households(*), profiles(*)')
    .eq('profile_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} member={member} />
      <div className="lg:pl-64 pb-20 lg:pb-0">
        <Header user={user} member={member} />
        <main className="p-4 lg:p-6">
          <InvitationBanner />
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
