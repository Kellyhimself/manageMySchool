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
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { useStudents } from "@/hooks/use-students"

interface Student {
  id: string
  name: string
  admission_number: string | null
}

interface Exam {
  id: string
  subject: string
  grade: string
  total_marks: number
  passing_marks: number
  academic_year: string
  date: string
  exam_type: string
  term: string
}

interface Result {
  student_id: string
  score: number
  remarks?: string
  teacher_remarks?: string
  principal_remarks?: string
}

export default function ResultsEntryPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const resolvedParams = use(params)
  const examId = resolvedParams.examId
  const router = useRouter()
  const { user, school, isLoading: isAuthLoading } = useAuth()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)

  // Use the useStudents hook with the exam's grade
  const { data: students = [], isLoading: isLoadingStudents } = useStudents({
    class: exam?.grade
  })

  // Initialize results state
  const [results, setResults] = useState<Record<string, Result>>({})

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login")
      return
    }

    async function loadExam() {
      try {
        // Load exam details
        const { data: examData, error: examError } = await supabase
          .from("exams")
          .select("*")
          .eq("id", examId)
          .eq("school_id", school?.id)
          .single()

        if (examError) throw examError
        setExam(examData)

        // Initialize results for existing students
        const initialResults: Record<string, Result> = {}
        students.forEach((student) => {
          initialResults[student.id] = {
            student_id: student.id,
            score: 0,
          }
        })
        setResults(initialResults)
      } catch (error) {
        console.error("Error loading exam:", error)
        toast.error("Failed to load exam data")
      } finally {
        setLoading(false)
      }
    }

    if (school?.id) {
      loadExam()
    }
  }, [examId, school?.id, router, isAuthLoading, user, students])

  const handleScoreChange = (studentId: string, score: number) => {
    setResults((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        score,
      },
    }))
  }

  const handleRemarksChange = (
    studentId: string,
    type: "remarks" | "teacher_remarks" | "principal_remarks",
    value: string
  ) => {
    setResults((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [type]: value,
      },
    }))
  }

  const handleSubmit = async () => {
    try {
      if (!school?.id || !exam) {
        toast.error("School or exam information not found")
        return
      }

      const resultsArray = Object.values(results)
      const { error } = await supabase.from("exams").upsert(
        resultsArray.map((result) => ({
          id: exam.id,
          student_id: result.student_id,
          score: result.score,
          remarks: result.remarks || null,
          teacher_remarks: result.teacher_remarks || null,
          principal_remarks: result.principal_remarks || null,
          school_id: school.id,
          academic_year: exam.academic_year,
          date: exam.date,
          exam_type: exam.exam_type,
          grade: exam.grade,
          passing_marks: exam.passing_marks,
          subject: exam.subject,
          term: exam.term,
          total_marks: exam.total_marks
        }))
      )

      if (error) throw error

      toast.success("Results saved successfully")
      router.push("/exams")
      router.refresh()
    } catch (error) {
      console.error("Error saving results:", error)
      toast.error("Failed to save results")
    }
  }

  if (isAuthLoading || loading || isLoadingStudents) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-red-500">Exam not found</p>
              <Button variant="outline" onClick={() => router.back()} className="mt-4">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>No Students Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p>No students found for this exam's grade.</p>
              <Button variant="outline" onClick={() => router.back()} className="mt-4">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Enter Results - {exam.subject}</CardTitle>
          <CardDescription>
            Grade: {exam.grade} | Total Marks: {exam.total_marks} | Passing
            Marks: {exam.passing_marks}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission Number</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Teacher Remarks</TableHead>
                  <TableHead>Principal Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.admission_number || 'N/A'}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={exam.total_marks}
                        value={results[student.id]?.score || 0}
                        onChange={(e) =>
                          handleScoreChange(student.id, Number(e.target.value))
                        }
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={results[student.id]?.remarks || ""}
                        onChange={(e) =>
                          handleRemarksChange(student.id, "remarks", e.target.value)
                        }
                        placeholder="Enter remarks"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={results[student.id]?.teacher_remarks || ""}
                        onChange={(e) =>
                          handleRemarksChange(
                            student.id,
                            "teacher_remarks",
                            e.target.value
                          )
                        }
                        placeholder="Enter teacher remarks"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={results[student.id]?.principal_remarks || ""}
                        onChange={(e) =>
                          handleRemarksChange(
                            student.id,
                            "principal_remarks",
                            e.target.value
                          )
                        }
                        placeholder="Enter principal remarks"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-6 space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save Results</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 