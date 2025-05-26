'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { useCreateStudent, useUpdateStudent } from '@/hooks/use-students'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Student } from '@/types/student'

const studentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  class: z.string().min(1, 'Class is required'),
  parent_phone: z.string().min(1, 'Parent phone is required'),
  parent_email: z.string().email('Invalid email').optional().or(z.literal('')),
  admission_number: z.string().min(1, 'Admission number is required'),
  school_id: z.string().min(1, 'School ID is required'),
})

type StudentFormData = z.infer<typeof studentSchema>

interface StudentFormProps {
  initialData?: Student
  onSuccess?: () => void
}

export function StudentForm({ initialData, onSuccess }: StudentFormProps) {
  const { user, school } = useAuth()
  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          class: initialData.class,
          parent_phone: initialData.parentPhone,
          parent_email: initialData.parentEmail || '',
          admission_number: initialData.admissionNumber,
          school_id: initialData.schoolId,
        }
      : {
          school_id: school?.id,
        },
  })

  const onSubmit = async (data: StudentFormData) => {
    try {
      if (initialData) {
        await updateStudent.mutateAsync({ ...data, id: initialData.id })
        toast.success('Student updated successfully')
      } else {
        await createStudent.mutateAsync(data)
        toast.success('Student created successfully')
      }
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save student:', error)
      toast.error('Failed to save student')
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl font-semibold">
          {initialData ? 'Edit Student' : 'Add New Student'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Information */}
            <div className="space-y-4 sm:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Student Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter student's full name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Input
                    id="class"
                    {...register('class')}
                    placeholder="Enter class"
                    className={errors.class ? 'border-red-500' : ''}
                  />
                  {errors.class && (
                    <p className="text-sm text-red-500">{errors.class.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admission_number">Admission Number</Label>
                  <Input
                    id="admission_number"
                    {...register('admission_number')}
                    placeholder="Enter admission number"
                    className={errors.admission_number ? 'border-red-500' : ''}
                  />
                  {errors.admission_number && (
                    <p className="text-sm text-red-500">{errors.admission_number.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="space-y-4 sm:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Parent Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent_phone">Phone Number</Label>
                  <Input
                    id="parent_phone"
                    {...register('parent_phone')}
                    placeholder="Enter parent's phone number"
                    className={errors.parent_phone ? 'border-red-500' : ''}
                  />
                  {errors.parent_phone && (
                    <p className="text-sm text-red-500">{errors.parent_phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent_email">Email (Optional)</Label>
                  <Input
                    id="parent_email"
                    type="email"
                    {...register('parent_email')}
                    placeholder="Enter parent's email"
                    className={errors.parent_email ? 'border-red-500' : ''}
                  />
                  {errors.parent_email && (
                    <p className="text-sm text-red-500">{errors.parent_email.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSuccess?.()}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Student' : 'Add Student'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 