import { supabase } from '@/lib/supabase/client'
import { NotificationService } from './notification.service'
import type { Database } from '@/types/supabase'
import { getDB } from '@/lib/indexeddb/client'
import { addToSyncQueue } from '@/lib/sync/sync-service'

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
    console.log('Starting report card generation:', {
      schoolId,
      studentCount: studentIds.length,
      term,
      academicYear
    });

    if (!navigator.onLine) {
      console.log('Offline mode detected, fetching from IndexedDB');
      const db = await getDB()
      const reportCards = await db.getAllFromIndex('report_cards', 'by-school', schoolId)
      return reportCards.filter(rc => 
        studentIds.includes(rc.student_id || '') && 
        rc.term === term && 
        rc.academic_year === academicYear
      )
    }

    // Get all students first to get their class/grade
    console.log('Fetching student information...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .in('id', studentIds)
      .eq('school_id', schoolId)

    if (studentsError) throw studentsError
    console.log(`Found ${students.length} students`);

    // Get the class/grade from the first student (assuming all students are from the same class)
    const studentClass = students[0]?.class
    if (!studentClass) {
      console.error('No class found for students');
      return [];
    }

    // Get all exams for the selected students in the given term and year
    console.log('Fetching exams from database...', {
      studentIds,
      term,
      academicYear,
      schoolId,
      studentClass
    });

    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('*')
      .in('student_id', studentIds)
      .eq('term', term)
      .eq('academic_year', academicYear)
      .eq('school_id', schoolId)
      .eq('grade', studentClass)

    if (examsError) throw examsError
    console.log(`Found ${exams.length} exams for the selected students`, {
      examDetails: exams.map(e => ({
        studentId: e.student_id,
        subject: e.subject,
        totalMarks: e.total_marks
      }))
    });

    // Generate report cards
    console.log('Generating report cards...');
    
    // First calculate all averages to determine positions
    const studentAverages = await Promise.all(
      students.map(async (student) => {
        const studentExams = exams.filter(exam => exam.student_id === student.id)
        if (studentExams.length === 0) return null;
        
        const totalMarks = studentExams.reduce((sum, exam) => sum + exam.total_marks, 0)
        const totalScore = studentExams.reduce((sum, exam) => sum + (exam.score || 0), 0)
        const averageMarks = (totalScore / totalMarks) * 100
        
        return {
          studentId: student.id,
          studentName: student.name,
          averageMarks,
          className: student.class
        }
      })
    )

    // Filter out null values and sort by average marks
    const validAverages = studentAverages.filter((avg): avg is NonNullable<typeof avg> => avg !== null)
      .sort((a, b) => b.averageMarks - a.averageMarks)

    // Calculate positions (handling ties)
    const positions = new Map<string, number>()
    let currentPosition = 1
    let currentAverage = -1
    let samePositionCount = 0

    validAverages.forEach((avg, index) => {
      if (avg.averageMarks !== currentAverage) {
        currentPosition = index + 1
        currentAverage = avg.averageMarks
        samePositionCount = 0
      } else {
        samePositionCount++
      }
      positions.set(avg.studentId, currentPosition)
    })

    // Now generate report cards with the calculated positions
    const reportCards: ReportCard[] = await Promise.all(
      students.map(async (student) => {
        const studentExams = exams.filter(exam => exam.student_id === student.id)
        
        // Skip students with no exams
        if (studentExams.length === 0) {
          console.warn(`No exams found for student ${student.name} (${student.id})`)
          return null
        }
        
        console.log(`Processing report card for ${student.name}:`, {
          examCount: studentExams.length,
          subjects: studentExams.map(e => e.subject)
        });
        
        // Calculate total marks and average
        const totalMarks = studentExams.reduce((sum, exam) => sum + exam.total_marks, 0)
        const totalScore = studentExams.reduce((sum, exam) => sum + (exam.score || 0), 0)
        const averageMarks = (totalScore / totalMarks) * 100  // Convert to percentage

        console.log(`Detailed marks calculation for ${student.name}:`, {
          exams: studentExams.map(exam => ({
            subject: exam.subject,
            totalMarks: exam.total_marks,
            score: exam.score || 0,
            percentage: ((exam.score || 0) / exam.total_marks) * 100
          })),
          totalMarks,
          totalScore,
          averageMarks,
          calculation: `(${totalScore} / ${totalMarks}) * 100 = ${averageMarks}%`
        });

        // Get the calculated position
        const classPosition = positions.get(student.id) || 1

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
          updated_at: new Date().toISOString(),
          school_id: schoolId
        }

        console.log(`Generated report card for ${student.name}:`, {
          totalMarks,
          averageMarks,
          grade,
          classPosition
        });

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

    // Filter out null values (students with no exams)
    const validReportCards = reportCards.filter((rc): rc is ReportCard => rc !== null)
    console.log(`Successfully generated ${validReportCards.length} report cards`);
    return validReportCards
  },

  async sendReportCards(
    reportCardIds: string[],
    notificationType: 'sms' | 'email' | 'both'
  ): Promise<void> {
    console.log('Starting to send report cards:', {
      reportCardCount: reportCardIds.length,
      notificationType
    });

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
    console.log(`Retrieved ${reportCards.length} report cards for sending`);

    const notificationService = NotificationService.getInstance()

    await Promise.all(
      reportCards.map(async (reportCard) => {
        const student = reportCard.students
        if (!student) {
          console.warn(`No student information found for report card ${reportCard.id}`);
          return;
        }

        const fullMessage = this.generateReportCardMessage(reportCard, student)
        const smsMessage = this.generateSMSMessage(reportCard, student)
        
        console.log(`Generated message for ${student.name}:`, {
          hasPhone: !!student.parent_phone,
          hasEmail: !!student.parent_email,
          notificationType
        });

        if (notificationType === 'sms' || notificationType === 'both') {
          if (student.parent_phone) {
            console.log(`Sending SMS to ${student.name}'s parent at ${student.parent_phone}`);
            await notificationService.sendSMS(student.parent_phone, smsMessage)
          } else {
            console.warn(`No phone number available for ${student.name}'s parent`);
          }
        }

        if (notificationType === 'email' || notificationType === 'both') {
          if (student.parent_email) {
            console.log(`Sending email to ${student.name}'s parent at ${student.parent_email}`);
            await notificationService.sendEmail(student.parent_email, 'Report Card', fullMessage)
          } else {
            console.warn(`No email available for ${student.name}'s parent`);
          }
        }
      })
    )
    console.log('Finished sending all report cards');
  },

  private async calculateClassPosition(
    schoolId: string,
    className: string,
    term: string,
    academicYear: string,
    studentAverage: number
  ): Promise<number> {
    // Get all report cards for the same class, term, and year
    const { data: classReportCards, error } = await supabase
      .from('report_cards')
      .select('average_marks')
      .eq('school_id', schoolId)
      .eq('term', term)
      .eq('academic_year', academicYear)
      .eq('grade', className)  // Add grade filter
      .order('average_marks', { ascending: false })

    if (error) throw error

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
  },

  private calculateGrade(averageMarks: number): string {
    if (averageMarks >= 80) return 'A'
    if (averageMarks >= 70) return 'B'
    if (averageMarks >= 60) return 'C'
    if (averageMarks >= 50) return 'D'
    return 'E'
  },

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
    `.trim();

    console.log('Generated report card message:', {
      studentName: student.name,
      messageLength: message.length,
      preview: message.substring(0, 100) + '...'
    });

    return message;
  },

  private generateSMSMessage(reportCard: ReportCard, student: Student): string {
    return `Report Card for ${student.name}: Term ${reportCard.term}, Avg: ${reportCard.average_marks}, Grade: ${reportCard.grade}, Position: ${reportCard.class_position}. Full report sent to your email.`;
  }
}

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
      error: error instanceof Error ? error.message : 'An error occurred' 
    }
  }
} 