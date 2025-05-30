import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './use-auth'
import { getDB } from '@/lib/indexeddb/client'
import { toast } from 'sonner'

export type Exam = {
  id: string
  subject: string
  exam_type: string
  term: string
  academic_year: string
  grade: string
  total_marks: number
  passing_marks: number
  date: string
  school_id: string
  student_id: string
  score?: number
  remarks?: string
  teacher_remarks?: string
  principal_remarks?: string
  created_at: string
  updated_at: string
}

export type CreateExamData = Omit<Exam, 'id' | 'created_at' | 'updated_at'>

export function useExams(filters?: { class?: string; term?: string; academic_year?: string }) {
  const { school } = useAuth()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['exams', { schoolId: school?.id, ...filters }],
    queryFn: async () => {
      if (!school) throw new Error('School context is required')

      try {
        // First try to get data from IndexedDB
        const db = await getDB()
        const cachedExams = await db.getAllFromIndex('exams', 'by-school', school.id)

        // If we're offline, return the cached data
        if (!navigator.onLine) {
          return cachedExams.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        }

        // If online, fetch fresh data and update IndexedDB
        let query = supabase
          .from('exams')
          .select('*')
          .eq('school_id', school.id)

        if (filters?.class) {
          query = query.eq('grade', filters.class)
        }
        if (filters?.term) {
          query = query.eq('term', filters.term)
        }
        if (filters?.academic_year) {
          query = query.eq('academic_year', filters.academic_year)
        }

        const { data: freshExams, error } = await query

        if (error) throw error

        // Update IndexedDB with fresh data
        for (const exam of freshExams) {
          await db.put('exams', exam)
        }

        return freshExams
      } catch (error) {
        // If there's an error and we're offline, try to get data from IndexedDB
        if (!navigator.onLine) {
          const db = await getDB()
          const exams = await db.getAllFromIndex('exams', 'by-school', school.id)
          return exams.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        }
        throw error
      }
    },
    enabled: !!school,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  })
}

export function useCreateExam() {
  const queryClient = useQueryClient()
  const { school } = useAuth()

  return useMutation({
    mutationFn: async (data: CreateExamData) => {
      if (!school) throw new Error('School context is required')

      if (!navigator.onLine) {
        // Store in IndexedDB for offline use
        const db = await getDB()
        const exam = {
          ...data,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        await db.put('exams', exam)
        return exam
      }

      const { data: exam, error } = await supabase
        .from('exams')
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return exam
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
    onError: (error) => {
      console.error('Error creating exam:', error)
      toast.error('Failed to create exam')
    },
  })
}

export function useUpdateExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Exam> & { id: string }) => {
      if (!navigator.onLine) {
        // Update in IndexedDB for offline use
        const db = await getDB()
        const exam = await db.get('exams', id)
        if (!exam) throw new Error('Exam not found')
        
        const updatedExam = {
          ...exam,
          ...data,
          updated_at: new Date().toISOString(),
        }
        await db.put('exams', updatedExam)
        return updatedExam
      }

      const { data: exam, error } = await supabase
        .from('exams')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return exam
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
    onError: (error) => {
      console.error('Error updating exam:', error)
      toast.error('Failed to update exam')
    },
  })
}

export function useDeleteExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        // Delete from IndexedDB for offline use
        const db = await getDB()
        await db.delete('exams', id)
        return id
      }

      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
    onError: (error) => {
      console.error('Error deleting exam:', error)
      toast.error('Failed to delete exam')
    },
  })
} 