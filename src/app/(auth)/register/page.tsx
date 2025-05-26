'use client'

import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/auth-context'
import { RegisterForm } from '@/components/forms/register-form'
import { toast } from 'sonner'
import type { RegisterCredentials } from '@/types/auth'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuthContext()

  const handleSubmit = async (credentials: RegisterCredentials) => {
    try {
      await register.mutateAsync(credentials)
      toast.success('Account created successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to register:', error)
      toast.error('Failed to create account. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="mt-2 text-gray-600">Sign up for your school management system</p>
        </div>
        <RegisterForm onSubmit={handleSubmit} isLoading={register.isPending} />
      </div>
    </div>
  )
} 