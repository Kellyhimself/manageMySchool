import { useState } from 'react'
import { useStudents } from '@/hooks/use-students'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CreateFeeDTO, Fee, UpdateFeeDTO } from '@/types/fee'

interface FeeFormProps {
  fee?: Fee
  onSubmit: (data: CreateFeeDTO | UpdateFeeDTO) => Promise<void>
  isLoading?: boolean
}

export function FeeForm({ fee, onSubmit, isLoading }: FeeFormProps) {
  const { data: students } = useStudents()
  const [formData, setFormData] = useState<CreateFeeDTO | UpdateFeeDTO>({
    studentId: fee?.studentId || '',
    amount: fee?.amount || 0,
    date: fee?.date ? new Date(fee.date) : new Date(),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{fee ? 'Edit Fee' : 'Add New Fee'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentId">Student</Label>
            <Select
              value={formData.studentId}
              onValueChange={(value) => setFormData({ ...formData, studentId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students?.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : fee ? 'Update Fee' : 'Add Fee'}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
} 