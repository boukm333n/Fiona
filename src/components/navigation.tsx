'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Home, TrendingUp, History, Bot, BarChart3, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Active Trades',
    href: '/trades/active',
    icon: TrendingUp,
  },
  {
    name: 'History',
    href: '/trades/history',
    icon: History,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Dojo',
    href: '/dojo',
    icon: Bot,
  },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full bg-stone-100 border-r border-stone-200/80 w-64">
      <div className="p-6">
        <h1 className="text-xl font-serif font-semibold text-stone-800">Fiona</h1>
        <p className="text-xs text-stone-500 mt-1">Mental Health Assistant</p>
      </div>
      
      <div className="px-4">
        <Button asChild className="w-full bg-stone-800 text-white hover:bg-stone-900">
          <Link href="/trades/new">
            <Plus className="w-4 h-4 mr-2" />
            New Trade
          </Link>
        </Button>
      </div>

      <nav className="flex-1 px-4 mt-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors',
              pathname.startsWith(item.href)
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:bg-white/50 hover:text-stone-900'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-stone-200/80">
        {/* Future user profile section */}
      </div>
    </aside>
  )
}
