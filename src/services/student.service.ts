import { supabase } from '@/lib/supabase/client'
import type { CreateStudentDTO, Student, StudentFilters, UpdateStudentDTO } from '@/types/student'

export const studentService = {
  async getAll(filters?: StudentFilters): Promise<Student[]> {
    console.log('Student service filters:', filters)
    let query = supabase
      .from('students')
      .select('*')

    if (filters?.schoolId) {
      console.log('Adding school ID filter:', filters.schoolId)
      query = query.eq('school_id', filters.schoolId)
    }

    if (filters?.search) {
      console.log('Adding search filter:', filters.search)
      query = query.or(`name.ilike.%${filters.search}%,class.ilike.%${filters.search}%`)
    }

    if (filters?.class) {
      query = query.eq('class', filters.class)
    }

    if (filters?.sortBy) {
      // Convert camelCase to snake_case for database columns
      const sortBy = filters.sortBy === 'createdAt' ? 'created_at' :
                    filters.sortBy === 'updatedAt' ? 'updated_at' :
                    filters.sortBy
      query = query.order(sortBy, { ascending: filters.sortOrder === 'asc' })
    }

    const { data, error } = await query
    console.log('Query result:', { data, error })

    if (error) throw error
    return data.map(student => ({
      ...student,
      parentPhone: student.parent_phone,
      parentEmail: student.parent_email || undefined,
      schoolId: student.school_id,
      createdAt: new Date(student.created_at),
      updatedAt: new Date(student.updated_at),
    })) as Student[]
  },

  async getById(id: string): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return {
      ...data,
      parentPhone: data.parent_phone,
      parentEmail: data.parent_email || undefined,
      schoolId: data.school_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    } as Student
  },

  async create(student: CreateStudentDTO): Promise<Student> {
    console.log('Creating student with data:', student)
    const { data, error } = await supabase
      .from('students')
      .insert({
        name: student.name,
        class: student.class,
        parent_phone: student.parent_phone,
        parent_email: student.parent_email || null,
        school_id: student.school_id,
        admission_number: student.admission_number
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating student:', error)
      throw error
    }

    return {
      ...data,
      parentPhone: data.parent_phone,
      parentEmail: data.parent_email || undefined,
      schoolId: data.school_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    } as Student
  },

  async update(student: UpdateStudentDTO): Promise<Student> {
    console.log('Updating student with data:', student)
    const { data, error } = await supabase
      .from('students')
      .update({
        name: student.name,
        class: student.class,
        parent_phone: student.parent_phone,
        parent_email: student.parent_email || null,
        school_id: student.school_id,
        admission_number: student.admission_number
      })
      .eq('id', student.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating student:', error)
      throw error
    }

    return {
      ...data,
      parentPhone: data.parent_phone,
      parentEmail: data.parent_email || undefined,
      schoolId: data.school_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    } as Student
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
} 