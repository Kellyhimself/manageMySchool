import { supabase } from '@/lib/supabase/client'
import type { CreateExamDTO, Exam, ExamFilters, UpdateExamDTO } from '@/types/exam'

export const examService = {
  async getAll(filters?: ExamFilters): Promise<Exam[]> {
    let query = supabase
      .from('exams')
      .select('*')

    if (filters?.schoolId) {
      query = query.eq('schoolId', filters.schoolId)
    }

    if (filters?.studentId) {
      query = query.eq('studentId', filters.studentId)
    }

    if (filters?.subject) {
      query = query.eq('subject', filters.subject)
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate.toISOString())
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate.toISOString())
    }

    if (filters?.sortBy) {
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })
    }

    const { data, error } = await query

    if (error) throw error
    return data as Exam[]
  },

  async getById(id: string): Promise<Exam> {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Exam
  },

  async create(exam: CreateExamDTO): Promise<Exam> {
    const { data, error } = await supabase
      .from('exams')
      .insert({
        ...exam,
        date: exam.date.toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data as Exam
  },

  async update(exam: UpdateExamDTO): Promise<Exam> {
    const { data, error } = await supabase
      .from('exams')
      .update({
        ...exam,
        date: exam.date?.toISOString(),
      })
      .eq('id', exam.id)
      .select()
      .single()

    if (error) throw error
    return data as Exam
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
} 