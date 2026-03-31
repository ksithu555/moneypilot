'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Target,
  Camera,
  Brain,
  Settings,
  Users,
  PieChart,
  TrendingUp,
  PlusCircle,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Quick Input', href: '/quick-input', icon: PlusCircle, highlight: true },
  // { name: 'Accounts', href: '/dashboard/accounts', icon: Wallet },
  { name: 'Transactions', href: '/dashboard/transactions', icon: ArrowLeftRight },
  { name: 'Categories', href: '/dashboard/categories', icon: PieChart },
  { name: 'Goals', href: '/dashboard/goals', icon: Target },
  { name: 'Receipts', href: '/dashboard/receipts', icon: Camera },
  { name: 'Forecast', href: '/dashboard/forecast', icon: TrendingUp },
  { name: 'AI Insights', href: '/dashboard/insights', icon: Brain },
]

const bottomNavigation = [
  { name: 'Household', href: '/dashboard/household', icon: Users, description: 'Manage members' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  user: any
  member: any
}

export function Sidebar({ member }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-navy-950 px-4 py-6">
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 mb-8">
          <Wallet className="h-7 w-7 text-success" />
          <span className="text-xl font-bold text-white">Moneypilot</span>
        </div>

        {/* Vault Name */}
        {member?.households && (
          <div className="px-3 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Vault</p>
            <p className="font-medium text-white truncate">{member.households.name}</p>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const isHighlight = (item as any).highlight
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  isHighlight && !isActive
                    ? 'bg-success/20 text-success hover:bg-success/30'
                    : isActive
                      ? 'bg-success text-white'
                      : 'text-gray-400 hover:bg-navy-900 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-navy-800 pt-4 mt-4 space-y-1">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-success text-white'
                    : 'text-gray-400 hover:bg-navy-900 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
