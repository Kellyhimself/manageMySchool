import { supabase } from '@/lib/supabase/client'
import { notificationService } from './notification.service'
import type { Database } from '@/types/supabase'
import { getDB } from '@/lib/indexeddb/client'
import { addToSyncQueue } from '@/lib/sync/sync-service'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

type ReportCard = Database['public']['Tables']['report_cards']['Row']
type Exam = Database['public']['Tables']['exams']['Row']
type Student = Database['public']['Tables']['students']['Row']

// Client-side service for offline support and data fetching
export const reportCardService = {
  async generateReportCards(
    schoolId: string,
    studentIds: string[],
    term: string,
    academicYear: string
  ): Promise<ReportCard[]> {
    if (!navigator.onLine) {
      const db = await getDB()
      const reportCards = await db.getAllFromIndex('report_cards', 'by-school', schoolId)
      return reportCards.filter(rc => 
        studentIds.includes(rc.student_id || '') && 
        rc.term === term && 
        rc.academic_year === academicYear
      )
    }

    // Get all exams for the selected students in the given term and year
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('*')
      .in('student_id', studentIds)
      .eq('term', term)
      .eq('academic_year', academicYear)
      .eq('school_id', schoolId)

    if (examsError) throw examsError

    // Get all students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .in('id', studentIds)
      .eq('school_id', schoolId)

    if (studentsError) throw studentsError

    // Generate report cards
    const reportCards: ReportCard[] = await Promise.all(
      students.map(async (student) => {
        const studentExams = exams.filter(exam => exam.student_id === student.id)
        
        // Calculate total marks and average
        const totalMarks = studentExams.reduce((sum, exam) => sum + exam.total_marks, 0)
        const averageMarks = totalMarks / studentExams.length

        // Calculate class position
        const classPosition = await this.calculateClassPosition(
          schoolId,
          student.class,
          term,
          academicYear,
          averageMarks
        )

        // Determine grade based on average marks
        const grade = this.calculateGrade(averageMarks)

        const reportCard: ReportCard = {
          id: crypto.randomUUID(),
          student_id: student.id,
          exam_id: studentExams[0]?.id || null,
          term,
          academic_year: academicYear,
          class_position: classPosition,
          total_marks: totalMarks,
          average_marks: averageMarks,
          grade,
          teacher_remarks: null,
          principal_remarks: null,
          parent_signature: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Save to database
        const { data, error } = await supabase
          .from('report_cards')
          .insert(reportCard)
          .select()
          .single()

        if (error) throw error
        return data
      })
    )

    return reportCards
  },

  async sendReportCards(
    reportCardIds: string[],
    notificationType: 'sms' | 'email' | 'both'
  ): Promise<void> {
    const { data: reportCards, error: reportCardsError } = await supabase
      .from('report_cards')
      .select(`
        *,
        students (
          name,
          parent_phone,
          parent_email
        )
      `)
      .in('id', reportCardIds)

    if (reportCardsError) throw reportCardsError

    await Promise.all(
      reportCards.map(async (reportCard) => {
        const student = reportCard.students
        if (!student) return

        const message = this.generateReportCardMessage(reportCard, student)

        if (notificationType === 'sms' || notificationType === 'both') {
          if (student.parent_phone) {
            await notificationService.sendSMS(student.parent_phone, message)
          }
        }

        if (notificationType === 'email' || notificationType === 'both') {
          if (student.parent_email) {
            await notificationService.sendEmail(student.parent_email, 'Report Card', message)
          }
        }
      })
    )
  },

  private async calculateClassPosition(
    schoolId: string,
    className: string,
    term: string,
    academicYear: string,
    studentAverage: number
  ): Promise<number> {
    const { data: classAverages, error } = await supabase
      .from('report_cards')
      .select('average_marks')
      .eq('school_id', schoolId)
      .eq('term', term)
      .eq('academic_year', academicYear)
      .order('average_marks', { ascending: false })

    if (error) throw error

    return classAverages.findIndex(avg => avg.average_marks === studentAverage) + 1
  },

  private calculateGrade(averageMarks: number): string {
    if (averageMarks >= 80) return 'A'
    if (averageMarks >= 70) return 'B'
    if (averageMarks >= 60) return 'C'
    if (averageMarks >= 50) return 'D'
    return 'E'
  },

  private generateReportCardMessage(reportCard: ReportCard, student: Student): string {
    return `
Dear Parent/Guardian,

REPORT CARD FOR ${student.name}
Term: ${reportCard.term}
Academic Year: ${reportCard.academic_year}

Total Marks: ${reportCard.total_marks}
Average Marks: ${reportCard.average_marks}
Grade: ${reportCard.grade}
Class Position: ${reportCard.class_position}

Teacher's Remarks: ${reportCard.teacher_remarks || 'N/A'}
Principal's Remarks: ${reportCard.principal_remarks || 'N/A'}

Please sign and return this report card to acknowledge receipt.

Thank you,
School Administration
    `.trim()
  }
}

// Server-side actions
export async function generateAndSendReportCards(
  schoolId: string,
  studentIds: string[],
  term: string,
  academicYear: string,
  notificationType: 'sms' | 'email' | 'both'
) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    // Generate report cards
    const reportCards = await reportCardService.generateReportCards(
      schoolId,
      studentIds,
      term,
      academicYear
    )

    // Send report cards
    await reportCardService.sendReportCards(
      reportCards.map(rc => rc.id),
      notificationType
    )

    revalidatePath('/exams/report-cards')
    return { success: true }
  } catch (error) {
    console.error('Failed to generate and send report cards:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred' 
    }
  }
} 