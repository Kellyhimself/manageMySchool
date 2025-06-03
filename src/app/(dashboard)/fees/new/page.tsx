'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useStudents } from '@/hooks/use-students'
import { useCreateFee, createFeeOffline } from '@/hooks/use-fees'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { getDB } from '@/lib/indexeddb/client'
import { useQueryClient } from '@tanstack/react-query'
import type { Tables } from '@/types/supabase'

type Student = Tables<'students'>

export default function NewFeePage() {
  const router = useRouter()
  const { school } = useAuth()
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  // Get all students with class filter
  const { data: students, isLoading: isLoadingStudents } = useStudents({
    class: selectedClass === 'all' ? undefined : selectedClass
  })

  const createFee = useCreateFee()

  // Get unique classes from students, ensuring students is an array
  const classes = useMemo(() => {
    if (!students || !Array.isArray(students)) return []
    return Array.from(new Set(students.map((student: Student) => student.class))).sort()
  }, [students])

  const handleSelectAll = () => {
    if (!students || !Array.isArray(students)) return
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(students.map((student: Student) => student.id)))
    }
  }

  const handleStudentSelect = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || selectedStudents.size === 0 || !school) {
      toast.error('Please enter an amount and select at least one student')
      return
    }

    setIsSubmitting(true)
    try {
      const feeAmount = parseFloat(amount)
      if (isNaN(feeAmount) || feeAmount <= 0) {
        throw new Error('Invalid amount')
      }

      const isOnline = navigator.onLine
      console.log('Creating fees, online status:', isOnline)

      if (isOnline) {
        // Online mode: Use mutation
        console.log('Online mode: Using mutation')
        const promises = Array.from(selectedStudents).map(studentId =>
          createFee.mutateAsync({
            student_id: studentId,
            school_id: school.id,
            amount: feeAmount,
            description: description || undefined,
            due_date: new Date().toISOString(),
            date: new Date().toISOString()
          })
        )

        await Promise.all(promises)
        toast.success('Fees created successfully')
      } else {
        // Offline mode: Use createFeeOffline
        console.log('Offline mode: Using createFeeOffline')
        const promises = Array.from(selectedStudents).map(studentId =>
          createFeeOffline({
            student_id: studentId,
            school_id: school.id,
            amount: feeAmount,
            description: description || undefined,
            due_date: new Date().toISOString(),
            date: new Date().toISOString()
          })
        )

        await Promise.all(promises)

        // Get all fees from IndexedDB to update the UI
        const db = await getDB()
        const allFees = await db.getAllFromIndex('fees', 'by-school', school.id)
        const sortedFees = allFees.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        // Update the cache with all fees from IndexedDB
        queryClient.setQueryData(
          ['fees', { schoolId: school.id }],
          sortedFees
        )

        toast.success('Fees created offline. Will sync when online.')
      }

      router.push('/fees')
    } catch (error) {
      console.error('Failed to create fees:', error)
      toast.error('Failed to create fees')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Only show loading state for online operations
  const isSubmittingOnline = isSubmitting && navigator.onLine

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Create New Fees</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStudents ? (
              <div className="text-center py-4">Loading students...</div>
            ) : !students || !Array.isArray(students) ? (
              <div className="text-center py-4 text-red-500">Failed to load students</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Fee Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (KES)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter fee amount"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter fee description"
                    />
                  </div>
                </div>

                {/* Class Filter */}
                <div className="space-y-2">
                  <Label htmlFor="class">Filter by Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((className) => (
                        <SelectItem key={className} value={className}>
                          {className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Student Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Select Students</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedStudents.size === (students?.length || 0) ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    {isLoadingStudents ? (
                      <div className="text-center py-4">Loading students...</div>
                    ) : students?.length === 0 ? (
                      <div className="text-center py-4">No students found</div>
                    ) : (
                      <div className="space-y-2">
                        {students?.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                          >
                            <Checkbox
                              id={student.id}
                              checked={selectedStudents.has(student.id)}
                              onCheckedChange={() => handleStudentSelect(student.id)}
                            />
                            <Label
                              htmlFor={student.id}
                              className="flex-1 cursor-pointer"
                            >
                              {student.name} - {student.class}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/fees')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || selectedStudents.size === 0}
                  >
                    {isSubmittingOnline ? 'Creating Fees...' : 'Create Fees'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 