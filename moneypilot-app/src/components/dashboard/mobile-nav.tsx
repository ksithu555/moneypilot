'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  PlusCircle,
  ArrowLeftRight,
  Target,
  Settings,
} from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Input', href: '/quick-input', icon: PlusCircle, highlight: true },
  { name: 'History', href: '/dashboard/transactions', icon: ArrowLeftRight },
  { name: 'Goals', href: '/dashboard/goals', icon: Target },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && item.href !== '/quick-input' && pathname.startsWith(item.href))
          const isHighlight = (item as any).highlight
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs font-medium transition-colors',
                isHighlight 
                  ? 'text-white' 
                  : isActive
                    ? 'text-success'
                    : 'text-gray-500'
              )}
            >
              {isHighlight ? (
                <div className="w-12 h-12 -mt-6 bg-success rounded-full flex items-center justify-center shadow-lg">
                  <item.icon className="h-6 w-6 text-white" />
                </div>
              ) : (
                <item.icon className={cn(
                  'h-5 w-5',
                  isActive ? 'text-success' : 'text-gray-400'
                )} />
              )}
              <span className={isHighlight ? 'text-success' : ''}>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
