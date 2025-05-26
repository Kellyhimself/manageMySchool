export interface Fee {
  id: string
  student_id: string
  school_id: string
  amount: number
  amount_paid?: number
  date: string
  due_date: string
  status: 'pending' | 'paid' | 'overdue'
  description?: string
  payment_method?: 'mpesa' | 'bank' | 'cash'
  payment_reference?: string
  payment_date?: string
  receipt_url?: string
  payment_details?: {
    paybill_number?: string
    account_number?: string
    bank_name?: string
    bank_account?: string
    bank_slip_number?: string
  }
  student_name?: string
  created_at: string
  updated_at: string
}

export interface CreateFeeDTO {
  student_id: string
  school_id: string
  amount: number
  description?: string
  due_date: string
  date?: string
  status?: 'pending' | 'paid' | 'overdue'
}

export interface UpdateFeeDTO extends Partial<CreateFeeDTO> {
  id: string
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
  paymentMethod: 'mpesa' | 'bank' | 'cash'
  paymentDetails?: {
    paybill_number?: string
    account_number?: string
    bank_name?: string
    bank_account?: string
    bank_slip_number?: string
  }
} 