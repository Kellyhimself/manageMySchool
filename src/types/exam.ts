export interface Exam {
  id: string
  studentId: string
  schoolId: string
  subject: string
  score: number
  grade: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateExamDTO {
  studentId: string
  schoolId: string
  subject: string
  score: number
  grade: string
  date: Date
}

export interface UpdateExamDTO extends Partial<CreateExamDTO> {
  id: string
}

export interface ExamFilters {
  studentId?: string
  schoolId?: string
  subject?: string
  startDate?: Date
  endDate?: Date
  sortBy?: keyof Exam
  sortOrder?: 'asc' | 'desc'
} 