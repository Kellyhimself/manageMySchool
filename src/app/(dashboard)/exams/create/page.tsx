"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { useCreateExam } from '@/hooks/use-exams'
import { useStudents } from '@/hooks/use-students'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ALL_CLASS_OPTIONS } from '@/lib/constants/classes'
import { useState } from 'react'

const examSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  exam_type: z.string().min(1, 'Exam type is required'),
  term: z.string().min(1, 'Term is required'),
  academic_year: z.string().min(1, 'Academic year is required'),
  grade: z.string().min(1, 'Class is required'),
  total_marks: z.coerce.number().min(1, 'Total marks is required'),
  passing_marks: z.coerce.number().min(1, 'Passing marks is required'),
  date: z.string().min(1, 'Date is required'),
  school_id: z.string().min(1, 'School ID is required'),
  student_ids: z.array(z.string()).min(1, 'At least one student must be selected'),
})

type ExamFormData = z.infer<typeof examSchema>

const EXAM_TYPES = ['Regular', 'Midterm', 'Final'] as const
const TERMS = ['Term 1', 'Term 2', 'Term 3'] as const

export default function CreateExamPage() {
  const router = useRouter()
  const { school } = useAuth()
  const createExam = useCreateExam()
  const [selectedClass, setSelectedClass] = useState<string>('')
  const { data: students = [], isLoading: isLoadingStudents } = useStudents({
    class: selectedClass
  })
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      school_id: school?.id,
      exam_type: 'Regular',
      term: 'Term 1',
      academic_year: new Date().getFullYear().toString(),
      total_marks: 100,
      passing_marks: 40,
      date: new Date().toISOString().split('T')[0],
      student_ids: [],
    },
  })

  const onSubmit = async (data: ExamFormData) => {
    try {
      // Create an exam for each selected student
      const examPromises = data.student_ids.map(studentId => {
        const examData = {
          academic_year: data.academic_year,
          date: data.date,
          exam_type: data.exam_type,
          grade: data.grade,
          passing_marks: data.passing_marks,
          school_id: data.school_id,
          score: 0, // Initialize with 0 score
          student_id: studentId,
          subject: data.subject,
          term: data.term,
          total_marks: data.total_marks,
        }
        return createExam.mutateAsync(examData)
      })

      await Promise.all(examPromises)
      toast.success('Exams created successfully')
      router.push('/exams')
    } catch (error) {
      console.error('Error creating exams:', error)
      toast.error('Failed to create exams')
    }
  }

  const handleClassChange = (value: string) => {
    setSelectedClass(value)
    setSelectedStudents([])
    setValue('grade', value)
  }

  const handleSelectAllStudents = (checked: boolean) => {
    if (checked) {
      const allStudentIds = students.map(student => student.id)
      setSelectedStudents(allStudentIds)
      setValue('student_ids', allStudentIds)
    } else {
      setSelectedStudents([])
      setValue('student_ids', [])
    }
  }

  const handleStudentSelect = (studentId: string, checked: boolean) => {
    let newSelectedStudents: string[]
    if (checked) {
      newSelectedStudents = [...selectedStudents, studentId]
    } else {
      newSelectedStudents = selectedStudents.filter(id => id !== studentId)
    }
    setSelectedStudents(newSelectedStudents)
    setValue('student_ids', newSelectedStudents)
  }

  const isLoading = isSubmitting || createExam.isPending || isLoadingStudents

  if (!school) {
    return <div>Loading...</div>
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl font-semibold">Create New Exam</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Class Selection */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="grade">Class</Label>
              <Select
                value={selectedClass}
                onValueChange={handleClassChange}
              >
                <SelectTrigger
                  id="grade"
                  className={errors.grade ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CLASS_OPTIONS.map((classOption) => (
                    <SelectItem key={classOption} value={classOption}>
                      {classOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.grade && (
                <p className="text-red-500">{errors.grade.message}</p>
              )}
            </div>

            {/* Student Selection */}
            {selectedClass && (
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>Students</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      onCheckedChange={handleSelectAllStudents}
                      checked={selectedStudents.length === students.length}
                    />
                    <Label htmlFor="select-all" className="text-sm">Select All</Label>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={student.id}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                      />
                      <Label htmlFor={student.id} className="text-sm">
                        {student.name} ({student.admission_number})
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.student_ids && (
                  <p className="text-red-500">{errors.student_ids.message}</p>
                )}
              </div>
            )}

            {/* Exam Details */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                {...register('subject')}
                placeholder="Enter subject"
                className={errors.subject ? 'border-red-500' : ''}
              />
              {errors.subject && (
                <p className="text-red-500">{errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam_type">Exam Type</Label>
              <Select
                value={watch('exam_type')}
                onValueChange={(value) => setValue('exam_type', value)}
              >
                <SelectTrigger
                  id="exam_type"
                  className={errors.exam_type ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.exam_type && (
                <p className="text-red-500">{errors.exam_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Term</Label>
              <Select
                value={watch('term')}
                onValueChange={(value) => setValue('term', value)}
              >
                <SelectTrigger
                  id="term"
                  className={errors.term ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.term && (
                <p className="text-red-500">{errors.term.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="academic_year">Academic Year</Label>
              <Input
                id="academic_year"
                {...register('academic_year')}
                placeholder="Enter academic year"
                className={errors.academic_year ? 'border-red-500' : ''}
              />
              {errors.academic_year && (
                <p className="text-red-500">{errors.academic_year.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_marks">Total Marks</Label>
              <Input
                id="total_marks"
                type="number"
                {...register('total_marks', { valueAsNumber: true })}
                placeholder="Enter total marks"
                className={errors.total_marks ? 'border-red-500' : ''}
              />
              {errors.total_marks && (
                <p className="text-red-500">{errors.total_marks.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="passing_marks">Passing Marks</Label>
              <Input
                id="passing_marks"
                type="number"
                {...register('passing_marks', { valueAsNumber: true })}
                placeholder="Enter passing marks"
                className={errors.passing_marks ? 'border-red-500' : ''}
              />
              {errors.passing_marks && (
                <p className="text-red-500">{errors.passing_marks.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Exam Date</Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && (
                <p className="text-red-500">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/exams')}
              className="w-full sm:w-auto"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Creating...' : 'Create Exam'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 