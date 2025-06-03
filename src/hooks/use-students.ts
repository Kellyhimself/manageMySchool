import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import type { StudentFilters, StudentCreate, StudentUpdate, Student } from '@/types/student'
import { studentService } from '@/services/student.service'
import { toast } from 'sonner'
import { getDB } from '@/lib/indexeddb/client'
import { addToSyncQueue } from '@/lib/sync/sync-service'

export function useStudents(filters?: StudentFilters) {
  const { school } = useAuth()
  
  return useQuery({
    queryKey: ['students', { schoolId: school?.id, search: filters?.search || '', class: filters?.class || '' }],
    queryFn: async () => {
      if (!school) throw new Error('School context is required')
      
      try {
        // First try to get data from IndexedDB
        const db = await getDB()
        const cachedStudents = await db.getAllFromIndex('students', 'by-school', school.id)
        
        // If we're offline, return the cached data
        if (!navigator.onLine) {
          let filteredStudents = cachedStudents;
          
          // Apply class filter if specified
          if (filters?.class) {
            filteredStudents = filteredStudents.filter(student => student.class === filters.class);
          }
          
          // Apply search filter if specified
          if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            filteredStudents = filteredStudents.filter(student => 
              student.name.toLowerCase().includes(searchLower) ||
              (student.admission_number && student.admission_number.toLowerCase().includes(searchLower))
            );
          }
          
          return filteredStudents.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
        
        // If online, fetch fresh data and update IndexedDB
        const freshStudents = await studentService.getStudents(school.id, { 
          class: filters?.class,
          search: filters?.search 
        })
        
        // Update IndexedDB with fresh data
        for (const student of freshStudents) {
          await db.put('students', student)
        }
        
        return freshStudents
      } catch (error) {
        // If there's an error and we're offline, try to get data from IndexedDB
        if (!navigator.onLine) {
          const db = await getDB()
          let students = await db.getAllFromIndex('students', 'by-school', school.id)
          
          // Apply class filter if specified
          if (filters?.class) {
            students = students.filter(student => student.class === filters.class);
          }
          
          // Apply search filter if specified
          if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            students = students.filter(student => 
              student.name.toLowerCase().includes(searchLower) ||
              (student.admission_number && student.admission_number.toLowerCase().includes(searchLower))
            );
          }
          
          return students.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
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

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentService.getStudent(id),
    retry: 1,
    retryDelay: 1000,
  })
}

export async function createStudentOffline(data: StudentCreate) {
  const now = new Date().toISOString();
  const newStudent: Student = {
    ...data,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
    sync_status: 'pending',
    parent_email: data.parent_email || null,
    admission_number: data.admission_number || null
  };
  const db = await getDB();
  await db.put('students', newStudent);
  // Add to sync queue
  await addToSyncQueue('students', newStudent.id, 'create', newStudent);
  return newStudent;
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (data: StudentCreate) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to create a student')
      }

      // Verify that the school_id matches
      if (data.school_id !== user.school_id) {
        throw new Error('Cannot create student for a different school')
      }

      // Only handle online creation here
      const student = await studentService.createStudent(data)
      return student
    },
    onSuccess: (data) => {
      // Update cache with the correct query key
      queryClient.setQueryData<Student[]>(['students', { schoolId: school?.id }], (old) => {
        if (!old) return [data]
        return [...old, data]
      })
      toast.success('Student created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create student')
    }
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (data: StudentUpdate) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to update a student')
      }

      // Verify that the school_id matches
      if (data.school_id !== user.school_id) {
        throw new Error('Cannot update student for a different school')
      }

      const student = await studentService.updateStudent(data.id, data)
      return student
    },
    onSuccess: (data, variables) => {
      // Update the cache with the updated student
      queryClient.setQueryData<Student[]>(['students'], (old) => {
        if (!old) return [data]
        return old.map((student) => 
          student.id === variables.id ? data : student
        )
      })
      queryClient.invalidateQueries({ queryKey: ['students', variables.id] })

      // Show appropriate message based on online status
      if (!navigator.onLine) {
        toast.success('Student updated offline. Will sync when online.')
      } else {
        toast.success('Student updated successfully')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update student')
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
      const student = await studentService.getStudent(id)
      if (student.school_id !== user.school_id) {
        throw new Error('Cannot delete student from a different school')
      }

      await studentService.deleteStudent(id)
    },
    onSuccess: (_, id) => {
      // Remove the student from the cache
      queryClient.setQueryData<Student[]>(['students'], (old) => {
        if (!old) return []
        return old.filter((student) => student.id !== id)
      })
      queryClient.invalidateQueries({ queryKey: ['students', id] })

      // Show appropriate message based on online status
      if (!navigator.onLine) {
        toast.success('Student deleted offline. Will sync when online.')
      } else {
        toast.success('Student deleted successfully')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete student')
    }
  })
}