export interface Fee {
  id: string
  student_id: string
  school_id: string
  amount: number
  amount_paid: number | null
  date: string
  due_date: string | null
  status: string
  description: string | null
  payment_method: string | null
  payment_reference: string | null
  payment_date: string | null
  receipt_url: string | null
  payment_details: any | null
  created_at: string
  updated_at: string
  sync_status: 'pending' | 'synced'
  fee_type: string | null
  student_admission_number: string | null
  student_name: string | null
}

export interface FeeCreate {
  student_id: string
  school_id: string
  amount: number
  date: string
  due_date?: string | null
  description?: string | null
  fee_type?: string | null
  student_admission_number?: string | null
}

export interface FeeUpdate {
  amount?: number
  amount_paid?: number | null
  date?: string
  due_date?: string | null
  status?: string
  description?: string | null
  payment_method?: string | null
  payment_reference?: string | null
  payment_date?: string | null
  receipt_url?: string | null
  payment_details?: any | null
  fee_type?: string | null
  student_admission_number?: string | null
}

export interface FeeFilters {
  school_id?: string
  student_id?: string
  status?: 'pending' | 'paid' | 'overdue'
  startDate?: Date
  endDate?: Date
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaymentDetails {
  amount: number
  paymentMethod: string
  paymentDetails?: {
    bank_slip_number?: string
    account_number?: string
    paybill_number?: string
    [key: string]: any
  }
} 