"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ALL_CLASS_OPTIONS } from "@/lib/constants/classes"

interface Exam {
  id: string
  date: string
  subject: string
  grade: string
  term: string
  academic_year: string
  student_id: string
  student: {
    name: string
    admission_number: string | null
  }
}

const EXAM_TYPES = ['Regular', 'Midterm', 'Final'] as const
const TERMS = ['Term 1', 'Term 2', 'Term 3'] as const

export default function ExamsPage() {
  const router = useRouter()
  const { user, school, isLoading: isAuthLoading } = useAuth()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    subject: '',
    grade: 'all',
    term: 'all',
    academic_year: '',
    exam_type: 'all',
    start_date: '',
    end_date: '',
    student_name: '',
  })

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login")
      return
    }

    async function loadExams() {
      try {
        let query = supabase
          .from("exams")
          .select(`
            *,
            student:students(name, admission_number)
          `)
          .eq("school_id", school?.id)

        // Apply filters
        if (filters.subject) {
          query = query.ilike('subject', `%${filters.subject}%`)
        }
        if (filters.grade && filters.grade !== 'all') {
          query = query.eq('grade', filters.grade)
        }
        if (filters.term && filters.term !== 'all') {
          query = query.eq('term', filters.term)
        }
        if (filters.academic_year) {
          query = query.eq('academic_year', filters.academic_year)
        }
        if (filters.exam_type && filters.exam_type !== 'all') {
          query = query.eq('exam_type', filters.exam_type)
        }
        if (filters.start_date) {
          query = query.gte('date', filters.start_date)
        }
        if (filters.end_date) {
          query = query.lte('date', filters.end_date)
        }
        if (filters.student_name) {
          query = query.ilike('student.name', `%${filters.student_name}%`)
        }

        const { data, error } = await query.order("date", { ascending: false })

        if (error) throw error
        setExams(data || [])
      } catch (error) {
        console.error("Error loading exams:", error)
      } finally {
        setLoading(false)
      }
    }

    if (school?.id) {
      loadExams()
    }
  }, [isAuthLoading, user, school?.id, router, filters])

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      subject: '',
      grade: 'all',
      term: 'all',
      academic_year: '',
      exam_type: 'all',
      start_date: '',
      end_date: '',
      student_name: '',
    })
  }

  if (isAuthLoading || loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Exam Management</h1>
        <div className="space-x-4">
          <Link href="/exams/create">
            <Button>Create New Exam</Button>
          </Link>
          <Link href="/exams/report-cards">
            <Button variant="outline">View Report Cards</Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter exams by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student_name">Student Name</Label>
              <Input
                id="student_name"
                placeholder="Filter by student name"
                value={filters.student_name}
                onChange={(e) => handleFilterChange('student_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Filter by subject"
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Class</Label>
              <Select
                value={filters.grade}
                onValueChange={(value) => handleFilterChange('grade', value)}
              >
                <SelectTrigger id="grade">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {ALL_CLASS_OPTIONS.map((classOption) => (
                    <SelectItem key={classOption} value={classOption}>
                      {classOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Term</Label>
              <Select
                value={filters.term}
                onValueChange={(value) => handleFilterChange('term', value)}
              >
                <SelectTrigger id="term">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {TERMS.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academic_year">Academic Year</Label>
              <Input
                id="academic_year"
                placeholder="Filter by year"
                value={filters.academic_year}
                onChange={(e) => handleFilterChange('academic_year', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam_type">Exam Type</Label>
              <Select
                value={filters.exam_type}
                onValueChange={(value) => handleFilterChange('exam_type', value)}
              >
                <SelectTrigger id="exam_type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {EXAM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exams</CardTitle>
          <CardDescription>
            View and manage all exams in your school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>{new Date(exam.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {exam.student?.name}
                    {exam.student?.admission_number && (
                      <span className="text-muted-foreground ml-2">
                        ({exam.student.admission_number})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell>{exam.grade}</TableCell>
                  <TableCell>{exam.term}</TableCell>
                  <TableCell>{exam.academic_year}</TableCell>
                  <TableCell>
                    <div className="space-x-2">
                      <Link href={`/exams/${exam.id}/results`}>
                        <Button variant="outline" size="sm">
                          Enter Results
                        </Button>
                      </Link>
                      <Link href={`/exams/${exam.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 