'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { use } from 'react'
import { useStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/use-students'
import { useAuth } from '@/hooks/use-auth'
import { StudentForm } from '@/components/forms/student-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const { data: student, isLoading } = useStudent(id)
  const { user, school } = useAuth()
  const updateStudent = useUpdateStudent()
  const deleteStudent = useDeleteStudent()
  const [isEditing, setIsEditing] = useState(false)

  const handleUpdate = async (data: any) => {
    try {
      await updateStudent.mutateAsync({ ...data, id })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update student:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteStudent.mutateAsync(id)
      router.push('/students')
    } catch (error) {
      console.error('Failed to delete student:', error)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!student) {
    return <div className="text-center py-8">Student not found</div>
  }

  // Check if user has permission to view this student
  if (user?.role !== 'admin' && student.school_id !== school?.id) {
    return <div className="text-center py-8">You don&apos;t have permission to view this student</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">{student.name}</h1>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the student
                  and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <StudentForm
              student={student}
              onSubmit={handleUpdate}
              isLoading={updateStudent.isPending}
            />
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-neutral-gray">Class</h3>
                <p>{student.class}</p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-gray">Parent Phone</h3>
                <p>{student.parent_phone}</p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-gray">Parent Email</h3>
                <p>{student.parent_email}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 