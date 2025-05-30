import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'
import type { User, School, LoginCredentials, RegisterCredentials, AuthResponse } from '@/types/auth'
import { supabase } from '@/lib/supabase/client'
import { getDB } from '@/lib/indexeddb/client'

interface AuthContext {
  user: User | null
  school: School | null
  isLoading: boolean
  isAuthenticated: boolean
  login: ReturnType<typeof useMutation<AuthResponse, Error, LoginCredentials>>
  register: ReturnType<typeof useMutation<AuthResponse, Error, RegisterCredentials>>
  logout: ReturnType<typeof useMutation<void, Error, void>>
}

export function useAuth(): AuthContext {
  const queryClient = useQueryClient()

  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      // If offline, try to get session from IndexedDB
      if (!navigator.onLine) {
        const db = await getDB()
        const authState = await db.get('auth_state', 'current')
        if (authState) {
          return {
            data: {
              session: {
                user: {
                  id: authState.user_id,
                  email: authState.email,
                  role: authState.role as 'admin' | 'teacher' | 'parent',
                  school_id: authState.school_id
                }
              }
            }
          }
        }
        return { data: { session: null } }
      }
      return supabase.auth.getSession()
    },
    retry: false,
  })

  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      if (!navigator.onLine) {
        const db = await getDB()
        const authState = await db.get('auth_state', 'current')
        if (authState) {
          return {
            user: {
              id: authState.user_id,
              email: authState.email,
              role: authState.role as 'admin' | 'teacher' | 'parent',
              school_id: authState.school_id,
              name: authState.name,
              createdAt: new Date(authState.created_at),
              updatedAt: new Date(authState.updated_at)
            },
            school: {
              id: authState.school_id,
              name: 'Offline Mode',
              email: authState.email,
              subscription_plan: 'core' as const,
              createdAt: new Date(authState.created_at),
              updatedAt: new Date(authState.updated_at)
            }
          }
        }
        throw new Error('No offline auth state found')
      }
      return authService.getCurrentUser()
    },
    retry: false,
    enabled: !!session?.data.session,
  })

  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await authService.login(credentials)
      
      // Store auth state in IndexedDB
      const now = new Date().toISOString()
      const db = await getDB()
      await db.put('auth_state', {
        id: 'current',
        user_id: response.user.id,
        school_id: response.user.school_id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
        created_at: now,
        updated_at: now,
        last_sync_at: now
      })

      return response
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data)
      toast.success('Logged in successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const register = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await authService.register(credentials)
      
      // Store auth state in IndexedDB
      const now = new Date().toISOString()
      const db = await getDB()
      await db.put('auth_state', {
        id: 'current',
        user_id: response.user.id,
        school_id: response.user.school_id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
        created_at: now,
        updated_at: now,
        last_sync_at: now
      })

      return response
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data)
      toast.success('Registered successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const logout = useMutation({
    mutationFn: async () => {
      await authService.logout()
      
      // Clear auth state from IndexedDB
      const db = await getDB()
      await db.delete('auth_state', 'current')
    },
    onSuccess: () => {
      queryClient.setQueryData(['user'], null)
      toast.success('Logged out successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return {
    user: userData?.user ?? null,
    school: userData?.school ?? null,
    isLoading: isSessionLoading || isUserLoading,
    isAuthenticated: !!userData?.user,
    login,
    register,
    logout,
  }
} 