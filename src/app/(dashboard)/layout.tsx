'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, school, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user || !school) {
    return null
  }

  // Map school from @/types/auth to @/types/school for Header
  const mappedSchool = {
    id: school.id,
    name: school.name,
    address: school.address ?? '',
    phone: school.phone ?? '',
    email: school.email,
    website: undefined,
    logo_url: undefined,
    created_at: (school.createdAt instanceof Date ? school.createdAt.toISOString() : String(school.createdAt)),
    updated_at: (school.updatedAt instanceof Date ? school.updatedAt.toISOString() : String(school.updatedAt)),
    payment_settings: school.payment_settings,
  };

  return (
    <div className="flex flex-col h-screen sm-mobile:flex-row">
      {/* Mobile sidebar toggle */}
      <div className="sm-mobile:hidden flex items-center h-14 px-2 border-b">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>
      {/* Sidebar: Sheet on mobile, static on desktop */}
      <div className="hidden sm-mobile:block h-full">
        <Sidebar />
      </div>
      <div className="sm-mobile:hidden">
        <Sidebar isMobile open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex flex-1 flex-col w-full">
        <Header user={user} school={mappedSchool!} />
        <main className="flex-1 overflow-y-auto p-2 sm-mobile:p-4 md-mobile:p-6">{children}</main>
      </div>
    </div>
  )
} 