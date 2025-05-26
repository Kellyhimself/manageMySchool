import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import type { StudentFilters, CreateStudentDTO, UpdateStudentDTO } from '@/types/student'
import { studentService } from '@/services/student.service'

export function useStudents(filters?: StudentFilters) {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: () => studentService.getAll(filters)
  })
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentService.getById(id),
    retry: 1,
    retryDelay: 1000,
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (data: CreateStudentDTO) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to create a student')
      }

      console.log('Creating student with data:', data)
      console.log('User role:', user.role)
      console.log('User school_id:', user.school_id)
      console.log('Student school_id:', data.school_id)

      // Verify that the school_id matches
      if (data.school_id !== user.school_id) {
        throw new Error('Cannot create student for a different school')
      }

      return studentService.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    }
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (data: UpdateStudentDTO) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to update a student')
      }

      // Verify that the school_id matches
      if (data.school_id !== user.school_id) {
        throw new Error('Cannot update student for a different school')
      }

      return studentService.update(data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['students', variables.id] })
    }
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to delete a student')
      }

      // First get the student to verify school_id
      const student = await studentService.getById(id)
      if (student.school_id !== user.school_id) {
        throw new Error('Cannot delete student from a different school')
      }

      return studentService.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    }
  })
}