'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/auth-context'
import { OfflineProvider } from '@/providers/offline-provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </OfflineProvider>
    </QueryClientProvider>
  )
} 