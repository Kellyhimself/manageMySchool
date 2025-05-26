export interface Student {
  id: string
  name: string
  class: string
  school_id: string
  admission_number: string
  parent_phone?: string
  parent_email?: string
  created_at: string
}

export interface CreateStudentDTO {
  name: string
  class: string
  admission_number: string
  parent_phone: string
  parent_email: string
  school_id: string
}

export interface UpdateStudentDTO extends Partial<CreateStudentDTO> {
  id: string
}

export interface StudentFilters {
  search?: string
  class?: string
  schoolId?: string
  sortBy?: keyof Student
  sortOrder?: 'asc' | 'desc'
} 