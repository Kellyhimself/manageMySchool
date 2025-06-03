'use client'

import { useState } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Menu, X, Home, Users, DollarSign, BookOpen, Bell, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Finance', href: '/fees', icon: DollarSign },
  { name: 'Exams', href: '/exams', icon: BookOpen },
  { name: 'Communications', href: '/communications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 shadow-lg bg-background/80 hover:bg-background"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-64 p-0 rounded-lg shadow-2xl animate-slide-in-from-top-left"
        style={{ minHeight: '100vh', maxHeight: '100vh' }}
        aria-labelledby="sidebar-title"
      >
        <h2 className="sr-only" id="sidebar-title">Sidebar Navigation</h2>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-14 border-b px-4 bg-background/90">
            <span className="font-semibold">Navigation</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-3 p-3">
            {navigation.map((item) => {
              const isActive = item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
              return (
                <div key={item.name}>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start transition-all duration-300 ease-in-out group',
                        'hover:scale-105 hover:text-primary hover:bg-background/80',
                        'border border-border rounded-lg',
                        'text-base font-medium',
                        'py-3 px-4',
                        isActive && 'bg-background/80 text-primary border-2',
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <item.icon className="mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                      {item.name}
                    </Button>
                  </Link>
                </div>
              )
            })}
          </nav>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Add animation class in your global CSS:
// .animate-slide-in-from-top-left { animation: slide-in-from-top-left 0.3s cubic-bezier(.4,0,.2,1); }
// @keyframes slide-in-from-top-left { from { opacity: 0; transform: translate(-40px, -40px) scale(0.95); } to { opacity: 1; transform: none; } } 