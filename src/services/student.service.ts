import { supabase } from '@/lib/supabase/client'
import type { Student, StudentCreate, StudentUpdate } from '@/types/student'
import { getDB } from '@/lib/indexeddb/client'
import { addToSyncQueue } from '@/lib/sync/sync-service'
import type { Database } from '@/types/supabase'

type SupabaseStudent = Database['public']['Tables']['students']['Row']

// Helper function to convert between online and offline student formats
const toOnlineStudent = (student: Student): Omit<SupabaseStudent, 'id'> => {
  const { sync_status, ...onlineStudent } = student
  return onlineStudent
}

const toOfflineStudent = (student: SupabaseStudent): Student => {
  return {
    ...student,
    sync_status: 'pending' as const
  }
}

export const studentService = {
  async getStudents(schoolId: string): Promise<Student[]> {
    if (!navigator.onLine) {
      const db = await getDB()
      const students = await db.getAllFromIndex('students', 'by-school', schoolId)
      return students
    }

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(toOfflineStudent)
  },

  async getStudent(id: string): Promise<Student> {
    if (!navigator.onLine) {
      const db = await getDB()
      const student = await db.get('students', id)
      if (!student) throw new Error('Student not found')
      return student
    }

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return toOfflineStudent(data)
  },

  async createStudent(student: StudentCreate): Promise<Student> {
    const now = new Date().toISOString()

    // If online, let Supabase generate the ID
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('students')
          .insert(toOnlineStudent({
            ...student,
            id: crypto.randomUUID(), // Temporary ID for type safety
            created_at: now,
            updated_at: now,
            sync_status: 'pending',
            parent_email: student.parent_email || null,
            admission_number: student.admission_number || null
          }))
          .select()
          .single()

        if (error) throw error

        // Save to IndexedDB with the server-generated ID
        const syncedStudent = toOfflineStudent(data)
        const db = await getDB()
        await db.put('students', syncedStudent)
        return syncedStudent
      } catch (error) {
        console.error('Failed to create student online:', error)
        // Fall through to offline creation
      }
    }

    // Offline creation or online creation failed
    const newStudent: Student = {
      ...student,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
      parent_email: student.parent_email || null,
      admission_number: student.admission_number || null
    }

    const db = await getDB()
    await db.put('students', newStudent)
    await addToSyncQueue('students', newStudent.id, 'create', toOnlineStudent(newStudent))
    return newStudent
  },

  async updateStudent(id: string, student: StudentUpdate): Promise<Student> {
    const now = new Date().toISOString()
    const db = await getDB()
    const existingStudent = await db.get('students', id)
    if (!existingStudent) throw new Error('Student not found')

    const updatedStudent: Student = {
      ...existingStudent,
      ...student,
      updated_at: now,
      sync_status: 'pending' as const,
      parent_email: student.parent_email ?? existingStudent.parent_email,
      admission_number: student.admission_number ?? existingStudent.admission_number
    }

    // Always save to IndexedDB first
    await db.put('students', updatedStudent)

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('students')
          .update(toOnlineStudent(updatedStudent))
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        // Update local record with server data
        const syncedStudent = toOfflineStudent(data)
        await db.put('students', syncedStudent)
        return syncedStudent
      } catch (error) {
        console.error('Failed to sync student update:', error)
        // Keep the offline version
      }
    }

    // If offline or sync failed, queue for sync
    await addToSyncQueue('students', id, 'update', toOnlineStudent(updatedStudent))
    return updatedStudent
  },

  async deleteStudent(id: string): Promise<void> {
    const db = await getDB()
    const student = await db.get('students', id)
    if (!student) throw new Error('Student not found')

    // Always delete from IndexedDB first
    await db.delete('students', id)

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', id)

        if (error) throw error
        return
      } catch (error) {
        console.error('Failed to sync student deletion:', error)
        // Keep the deletion in IndexedDB
      }
    }

    // If offline or sync failed, queue for sync
    await addToSyncQueue('students', id, 'delete', toOnlineStudent(student))
  }
} 