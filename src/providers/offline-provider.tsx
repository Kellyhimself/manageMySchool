import { createContext, useContext, useEffect, useState } from 'react'
import { getDB } from '@/lib/indexeddb/client'
import { toast } from 'sonner'

interface OfflineContextType {
  isOnline: boolean
  lastSyncTime: Date | null
  syncStatus: 'idle' | 'syncing' | 'error'
  triggerSync: () => Promise<void>
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle')

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Back online')
      triggerSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('You are offline. Changes will be synced when you are back online.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial state
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load last sync time from IndexedDB
  useEffect(() => {
    const loadLastSyncTime = async () => {
      const db = await getDB()
      const authState = await db.get('auth_state', 'current')
      if (authState?.last_sync_at) {
        setLastSyncTime(new Date(authState.last_sync_at))
      }
    }
    loadLastSyncTime()
  }, [])

  const triggerSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline')
      return
    }

    try {
      setSyncStatus('syncing')
      // TODO: Implement sync logic here
      // This will be implemented when we add offline data sync
      const now = new Date()
      setLastSyncTime(now)
      
      // Update last sync time in IndexedDB
      const db = await getDB()
      const authState = await db.get('auth_state', 'current')
      if (authState) {
        await db.put('auth_state', {
          ...authState,
          last_sync_at: now.toISOString()
        })
      }

      setSyncStatus('idle')
      toast.success('Sync completed successfully')
    } catch (error) {
      setSyncStatus('error')
      toast.error('Failed to sync changes')
      console.error('Sync error:', error)
    }
  }

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        lastSyncTime,
        syncStatus,
        triggerSync,
      }}
    >
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
} 