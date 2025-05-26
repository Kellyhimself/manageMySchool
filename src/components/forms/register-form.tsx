'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { RegisterCredentials } from '@/types/auth'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'teacher', 'parent']),
  school: z.object({
    name: z.string().min(2, 'School name must be at least 2 characters'),
    email: z.string().email('Invalid school email address'),
    address: z.string().optional(),
    phone: z.string().optional(),
    subscription_plan: z.enum(['core', 'premium']),
  }),
})

interface RegisterFormProps {
  onSubmit: (data: RegisterCredentials) => Promise<void>
  isLoading?: boolean
}

export function RegisterForm({ onSubmit, isLoading }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterCredentials>({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    school: {
      name: '',
      email: '',
      address: '',
      phone: '',
      subscription_plan: 'core',
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Registration failed:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>Enter your details to create your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'teacher' | 'parent' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">School Information</h3>

          <div>
            <Label htmlFor="schoolName">School Name</Label>
            <Input
              id="schoolName"
              value={formData.school.name}
              onChange={(e) => setFormData({ ...formData, school: { ...formData.school, name: e.target.value } })}
              required
            />
          </div>

          <div>
            <Label htmlFor="schoolEmail">School Email</Label>
            <Input
              id="schoolEmail"
              type="email"
              value={formData.school.email}
              onChange={(e) => setFormData({ ...formData, school: { ...formData.school, email: e.target.value } })}
              required
            />
          </div>

          <div>
            <Label htmlFor="schoolAddress">School Address</Label>
            <Input
              id="schoolAddress"
              value={formData.school.address}
              onChange={(e) => setFormData({ ...formData, school: { ...formData.school, address: e.target.value } })}
            />
          </div>

          <div>
            <Label htmlFor="schoolPhone">School Phone</Label>
            <Input
              id="schoolPhone"
              type="tel"
              value={formData.school.phone}
              onChange={(e) => setFormData({ ...formData, school: { ...formData.school, phone: e.target.value } })}
            />
          </div>

          <div>
            <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
            <Select
              value={formData.school.subscription_plan}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  school: { ...formData.school, subscription_plan: value as 'core' | 'premium' },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
    </Card>
  )
} 