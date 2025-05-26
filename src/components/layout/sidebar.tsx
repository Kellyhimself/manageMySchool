'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Users, 
  Receipt, 
  BookOpen, 
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Finance', href: '/fees', icon: Receipt },
  { name: 'Exams', href: '/exams', icon: BookOpen },
  { name: 'Communications', href: '/notifications', icon: Bell },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={cn(
      "flex h-full flex-col border-r bg-background transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!isCollapsed && <span className="font-semibold">Navigation</span>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-2">
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
                    'w-full justify-start hover:border-2 hover:border-yellow-400 hover:bg-transparent',
                    isActive && 'border-2 border-green-500 bg-transparent',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                  {!isCollapsed && item.name}
                </Button>
              </Link>
              {item.subItems && isActive && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link key={subItem.name} href={subItem.href}>
                      <Button
                        variant={pathname === subItem.href ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start hover:border-2 hover:border-yellow-400 hover:bg-transparent',
                          pathname === subItem.href && 'border-2 border-green-500 bg-transparent'
                        )}
                      >
                        <subItem.icon className="mr-2 h-4 w-4" />
                        {subItem.name}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
} 