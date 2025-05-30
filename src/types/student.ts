export interface Student {
  id: string
  name: string
  class: string
  parent_phone: string
  parent_email: string | null
  school_id: string
  admission_number: string | null
  created_at: string
  updated_at: string
  sync_status: 'synced' | 'pending'
}

export interface StudentCreate {
  name: string
  class: string
  parent_phone: string
  parent_email?: string | null
  school_id: string
  admission_number?: string | null
}

export interface StudentUpdate {
  id: string
  school_id: string
  name?: string
  class?: string
  parent_phone?: string
  parent_email?: string | null
  admission_number?: string | null
}

export interface StudentFilters {
  search?: string
  class?: string
  schoolId?: string
  sortBy?: keyof Student
  sortOrder?: 'asc' | 'desc'
} 