'use client'

import { useAuthContext } from '@/contexts/auth-context'
import { LoginForm } from '@/components/forms/login-form'
import type { LoginCredentials } from '@/types/auth'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const { login, user } = useAuthContext()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (credentials: LoginCredentials) => {
    try {
      const result = await login.mutateAsync(credentials)
      if (result.user && result.session.access_token) {
        toast.success('Login successful')
        // Force a hard navigation to trigger middleware
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Failed to login:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to login')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        <LoginForm onSubmit={handleSubmit} isLoading={login.isPending} />
      </div>
    </div>
  )
} 