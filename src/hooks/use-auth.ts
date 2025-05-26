import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'
import type { User, School, LoginCredentials, RegisterCredentials, AuthResponse } from '@/types/auth'
import { supabase } from '@/lib/supabase/client'

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
    queryFn: () => supabase.auth.getSession(),
    retry: false,
  })

  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['user'],
    queryFn: authService.getCurrentUser,
    retry: false,
    enabled: !!session?.data.session,
  })

  const login = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data)
      toast.success('Logged in successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const register = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data)
      toast.success('Registered successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const logout = useMutation({
    mutationFn: authService.logout,
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