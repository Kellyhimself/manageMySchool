import { useAuth } from '@/hooks/use-auth'
import { useStudents } from '@/hooks/use-students'
import { useCreateFee, useUpdateFee, createFeeOffline } from '@/hooks/use-fees'
import { useQueryClient } from '@tanstack/react-query'
import { getDB } from '@/lib/indexeddb/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

interface FeeFormData {
  student_id: string
  amount: number
  date: string
  school_id: string
  description?: string
  due_date?: string | null
  fee_type?: string | null
  student_admission_number?: string | null
  term?: string | null
  academic_year?: string | null
}

interface FeeFormProps {
  fee?: {
    id: string
    student_id: string
    amount: number
    date: string
    school_id: string
    description?: string
    due_date?: string
    fee_type?: string
    student_admission_number?: string
    term?: string
    academic_year?: string
  }
  onSuccess?: () => void
}

export function FeeForm({ fee, onSuccess }: FeeFormProps) {
  const { school } = useAuth()
  const { data: students, isLoading: isLoadingStudents, error: studentsError } = useStudents({
    schoolId: school?.id,
    search: '',
    class: ''
  })
  const createFee = useCreateFee()
  const updateFee = useUpdateFee()
  const queryClient = useQueryClient()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    student_id: fee?.student_id || '',
    amount: fee?.amount || 0,
    date: fee?.date ? new Date(fee.date) : new Date(),
    school_id: school?.id || '',
    description: fee?.description || '',
    due_date: fee?.due_date ? new Date(fee.due_date) : null,
    fee_type: fee?.fee_type || null,
    student_admission_number: fee?.student_admission_number || null,
    term: fee?.term || null,
    academic_year: fee?.academic_year || null
  })

  // Log school context on mount
  useEffect(() => {
    console.log('FeeForm mounted with school context:', school)
  }, [school])

  // Handle online/offline state changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!school?.id) {
      console.error('No school context available')
      toast.error('School context is required')
      return
    }

    console.log('Form submitted with context:', { 
      online: isOnline, 
      schoolId: school.id,
      formData 
    })
    
    setIsSubmitting(true)
    
    try {
      // Convert dates to ISO strings for API
      const apiData: FeeFormData = {
        ...formData,
        school_id: school.id, // Ensure school_id is set
        date: formData.date.toISOString(),
        due_date: formData.due_date?.toISOString() || null
      }
      console.log('Prepared API data:', apiData)

      if (isOnline) {
        console.log('Online mode: Using mutation')
        try {
          if (fee) {
            await updateFee.mutateAsync({ ...apiData, id: fee.id })
          } else {
            await createFee.mutateAsync(apiData)
          }
        } catch (error) {
          // If we get a network error, fall back to offline mode
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.log('Network error detected, falling back to offline mode')
            await createFeeOffline(apiData)
            await updateLocalCache()
            toast.success(fee ? 'Fee updated offline. Will sync when online.' : 'Fee created offline. Will sync when online.')
          } else {
            throw error
          }
        }
      } else {
        console.log('Offline mode detected, using offline creation')
        await createFeeOffline(apiData)
        await updateLocalCache()
        toast.success(fee ? 'Fee updated offline. Will sync when online.' : 'Fee created offline. Will sync when online.')
      }
      
      console.log('Form submission completed successfully')
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save fee:', error)
      toast.error('Failed to save fee')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to update local cache
  const updateLocalCache = async () => {
    const db = await getDB()
    const allFees = await db.getAllFromIndex('fees', 'by-school', school?.id || '')
    const sortedFees = allFees.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    // Update the cache with all fees from IndexedDB
    queryClient.setQueryData(
      ['fees', { schoolId: school?.id }],
      sortedFees
    )
  }

  // Only show loading state for online operations
  const isLoading = isOnline && (createFee.isPending || updateFee.isPending)
  console.log('Current loading state:', isLoading, 'Online:', isOnline, 'Create pending:', createFee.isPending, 'Update pending:', updateFee.isPending)

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{fee ? 'Edit Fee' : 'Add New Fee'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student_id">Student</Label>
            {isLoadingStudents ? (
              <div className="text-base text-muted-foreground">Loading students...</div>
            ) : studentsError ? (
              <div className="text-base text-red-500">
                {isOnline 
                  ? "Failed to load students. Please try again."
                  : "You're offline. Please check your connection."}
              </div>
            ) : !students || students.length === 0 ? (
              <div className="text-base text-muted-foreground">No students found</div>
            ) : (
              <Select
                value={formData.student_id}
                onValueChange={(value) => setFormData({ ...formData, student_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date.toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date (Optional)</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date?.toISOString().split('T')[0] || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                due_date: e.target.value ? new Date(e.target.value) : null 
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee_type">Fee Type</Label>
            <Input
              id="fee_type"
              value={formData.fee_type || ''}
              onChange={(e) => setFormData({ ...formData, fee_type: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="term">Term</Label>
            <Select
              value={formData.term || ''}
              onValueChange={(value) => setFormData({ ...formData, term: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Term 1">Term 1</SelectItem>
                <SelectItem value="Term 2">Term 2</SelectItem>
                <SelectItem value="Term 3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="academic_year">Academic Year</Label>
            <Input
              id="academic_year"
              value={formData.academic_year || ''}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              placeholder="e.g., 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSuccess?.()}
              className="w-auto"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-auto"
            >
              {isLoading
                ? 'Saving...'
                : fee
                ? 'Update Fee'
                : 'Add Fee'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
} 