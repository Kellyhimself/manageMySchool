'use client'

import { useRouter } from 'next/navigation'
import { StudentForm } from '@/components/forms/student-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewStudentPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-semibold">Add New Student</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentForm onSuccess={() => router.push('/students')} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 