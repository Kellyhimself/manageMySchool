import { supabase } from '@/lib/supabase/client'
import type { CreateFeeDTO, Fee, FeeFilters, UpdateFeeDTO, PaymentDetails } from '@/types/fee'
import { generateReceipt } from '@/lib/receipt'

export const feeService = {
  async getAll(filters?: FeeFilters): Promise<Fee[]> {
    let query = supabase
      .from('fees')
      .select(`
        *,
        students:student_id (
          name,
          admission_number
        )
      `)

    if (filters?.school_id) {
      query = query.eq('school_id', filters.school_id)
    }

    if (filters?.student_id) {
      query = query.eq('student_id', filters.student_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
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

    // Transform the data to include student_name
    return (data as any[]).map(fee => ({
      ...fee,
      student_name: fee.students?.name || 'Unknown Student'
    })) as Fee[]
  },

  async getById(id: string): Promise<Fee> {
    const { data, error } = await supabase
      .from('fees')
      .select(`
        *,
        students:student_id (
          name,
          admission_number
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Transform the data to include student_name
    return {
      ...data,
      student_name: data.students?.name || 'Unknown Student'
    } as Fee
  },

  async create(fee: CreateFeeDTO): Promise<Fee> {
    const { data, error } = await supabase
      .from('fees')
      .insert({
        ...fee,
        status: 'pending',
        date: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data as Fee
  },

  async update(fee: UpdateFeeDTO): Promise<Fee> {
    const { data, error } = await supabase
      .from('fees')
      .update({
        ...fee,
        date: fee.date ? new Date(fee.date).toISOString() : undefined,
      })
      .eq('id', fee.id)
      .select()
      .single()

    if (error) throw error
    return data as Fee
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('fees')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async processPayment(feeId: string, paymentDetails: PaymentDetails): Promise<Fee> {
    // Generate receipt
    const receiptUrl = await generateReceipt({
      id: feeId,
      amount: paymentDetails.amount,
      payment_method: paymentDetails.paymentMethod,
      payment_reference: paymentDetails.paymentDetails?.bank_slip_number || paymentDetails.paymentDetails?.account_number || '',
      payment_date: new Date().toISOString(),
    })

    const { data, error } = await supabase
      .from('fees')
      .update({
        status: 'paid',
        payment_method: paymentDetails.paymentMethod,
        payment_reference: paymentDetails.paymentDetails?.bank_slip_number || paymentDetails.paymentDetails?.account_number || '',
        payment_date: new Date().toISOString(),
        amount_paid: paymentDetails.amount,
        receipt_url: receiptUrl,
        payment_details: paymentDetails.paymentDetails
      })
      .eq('id', feeId)
      .select()
      .single()

    if (error) throw error
    return data as Fee
  },

  async markAsOverdue(feeId: string): Promise<Fee> {
    const { data, error } = await supabase
      .from('fees')
      .update({
        status: 'overdue',
      })
      .eq('id', feeId)
      .select()
      .single()

    if (error) throw error
    return data as Fee
  },
} 