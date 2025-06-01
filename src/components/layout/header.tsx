'use client'

import { useAuthContext } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, Menu } from 'lucide-react'
import { User as UserType } from '@supabase/supabase-js'
import { School } from '@/types/school'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface HeaderProps {
  user: UserType
  school: School
}

export function Header({ user, school }: HeaderProps) {
  const { logout } = useAuthContext()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* School Name - Always visible */}
        <div className="flex items-center pl-4">
          <a className="flex items-center space-x-2 group" href="/">
            <span className="font-bold truncate max-w-[150px] sm:max-w-none transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:text-primary">
              {school.name}
            </span>
          </a>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-end space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground hidden lg:inline-block transition-colors duration-300 hover:text-primary">
              {user.email}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={() => logout.mutate()}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center space-x-2">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col space-y-4 mt-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => {
                    logout.mutate()
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
} 