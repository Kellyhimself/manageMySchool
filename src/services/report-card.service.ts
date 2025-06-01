import { supabase } from '@/lib/supabase'
import { NotificationService } from './notification.service'
import type { Database } from '@/types/supabase'
import { getDB } from '@/lib/indexeddb/client'
import { addToSyncQueue } from '@/lib/sync/sync-service'

type ReportCard = Database['public']['Tables']['report_cards']['Row']
type Exam = Database['public']['Tables']['exams']['Row']
type Student = Database['public']['Tables']['students']['Row']

interface ReportCardWithStudent extends ReportCard {
  students: Student
}

class ReportCardService {
  private notificationService: NotificationService

  constructor() {
    this.notificationService = NotificationService.getInstance()
  }

  async generateReportCards(
    schoolId: string,
    studentIds: string[],
    term: string,
    academicYear: string
  ): Promise<ReportCard[]> {
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .in('id', studentIds)
      .eq('school_id', schoolId)

    if (studentsError) throw studentsError
    if (!students) return []

    const reportCards: ReportCard[] = []

    for (const student of students) {
      const { data: exams, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('student_id', student.id)
        .eq('term', term)
        .eq('academic_year', academicYear)
        .eq('school_id', schoolId)

      if (examsError) throw examsError
      if (!exams || exams.length === 0) continue

      const totalMarks = exams.reduce((sum, exam) => sum + (exam.score || 0), 0)
      const averageMarks = totalMarks / exams.length
      const grade = this.calculateGrade(averageMarks)
      const classPosition = await this.calculateClassPosition(
        schoolId,
        student.class,
        term,
        academicYear,
        averageMarks
      )

      const { data: reportCard, error: reportCardError } = await supabase
        .from('report_cards')
        .insert({
          school_id: schoolId,
          student_id: student.id,
          term,
          academic_year: academicYear,
          total_marks: totalMarks,
          average_marks: averageMarks,
          grade,
          class_position: classPosition,
          exam_id: exams[0].id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          parent_signature: false,
          teacher_remarks: null,
          principal_remarks: null
        })
        .select()
        .single()

      if (reportCardError) throw reportCardError
      if (reportCard) reportCards.push(reportCard as ReportCard)
    }

    return reportCards
  }

  async sendReportCards(
    reportCardIds: string[],
    notificationType: 'sms' | 'email' | 'both'
  ): Promise<void> {
    const { data: reportCards, error: reportCardsError } = await supabase
      .from('report_cards')
      .select(`
        *,
        students:student_id (
          name,
          parent_phone,
          parent_email
        )
      `)
      .in('id', reportCardIds)

    if (reportCardsError) throw reportCardsError
    if (!reportCards) return

    for (const reportCard of reportCards as ReportCardWithStudent[]) {
      const student = reportCard.students
      if (!student) continue

      const message = this.generateReportCardMessage(reportCard, student)
      const smsMessage = this.generateSMSMessage(reportCard, student)

      try {
        if (notificationType === 'sms' || notificationType === 'both') {
          if (student.parent_phone) {
            await this.notificationService.sendSMS(student.parent_phone, smsMessage)
          }
        }

        if (notificationType === 'email' || notificationType === 'both') {
          if (student.parent_email) {
            await this.notificationService.sendEmail(student.parent_email, 'Report Card', message)
          }
        }
      } catch (error) {
        console.error('Failed to send notification:', error)
      }
    }
  }

  private async calculateClassPosition(
    schoolId: string,
    className: string,
    term: string,
    academicYear: string,
    studentAverage: number
  ): Promise<number> {
    const { data: classReportCards, error } = await supabase
      .from('report_cards')
      .select('average_marks')
      .eq('school_id', schoolId)
      .eq('term', term)
      .eq('academic_year', academicYear)
      .eq('grade', className)
      .order('average_marks', { ascending: false })

    if (error) throw error

    if (!classReportCards) {
      return 1
    }

    // Group students by their average marks to handle ties
    const averagesByPosition = new Map<number, number[]>()
    classReportCards.forEach((rc, index) => {
      const position = index + 1
      if (!averagesByPosition.has(position)) {
        averagesByPosition.set(position, [])
      }
      averagesByPosition.get(position)?.push(rc.average_marks)
    })

    // Find the position where the student's average matches
    for (const [position, averages] of averagesByPosition) {
      if (averages.includes(studentAverage)) {
        return position
      }
    }

    // If no position found (shouldn't happen), return 1
    return 1
  }

  private calculateGrade(averageMarks: number): string {
    if (averageMarks >= 80) return 'A'
    if (averageMarks >= 70) return 'B'
    if (averageMarks >= 60) return 'C'
    if (averageMarks >= 50) return 'D'
    return 'E'
  }

  private generateReportCardMessage(reportCard: ReportCard, student: Student): string {
    const message = `
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

    console.log('Generated report card message:', {
      studentName: student.name,
      messageLength: message.length,
      preview: message.substring(0, 100) + '...'
    })

    return message
  }

  private generateSMSMessage(reportCard: ReportCard, student: Student): string {
    return `Report Card for ${student.name}: Term ${reportCard.term}, Avg: ${reportCard.average_marks}, Grade: ${reportCard.grade}, Position: ${reportCard.class_position}. Full report sent to your email.`
  }
}

export const reportCardService = new ReportCardService()

// Client-side function to generate and send report cards
export async function generateAndSendReportCards(
  schoolId: string,
  studentIds: string[],
  term: string,
  academicYear: string,
  notificationType: 'sms' | 'email' | 'both'
) {
  try {
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

    return { success: true }
  } catch (error) {
    console.error('Failed to generate and send report cards:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 