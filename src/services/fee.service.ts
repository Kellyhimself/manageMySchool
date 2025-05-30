import { supabase } from '@/lib/supabase/client'
import type { Fee, FeeCreate, FeeUpdate, PaymentDetails } from '@/types/fee'
import { getDB } from '@/lib/indexeddb/client'
import { addToSyncQueue } from '@/lib/sync/sync-service'
import type { Database } from '@/types/supabase'

type FeeRow = Database['public']['Tables']['fees']['Row']

type FeeWithStudent = FeeRow & {
  students: {
    name: string
    admission_number: string | null
  }[] | null
}

const transformFee = (fee: FeeWithStudent): Fee => {
  const student = fee.students?.[0] || null
  return {
    id: fee.id,
    student_id: fee.student_id,
    school_id: fee.school_id,
    amount: fee.amount,
    amount_paid: fee.amount_paid,
    date: fee.date,
    due_date: fee.due_date,
    status: fee.status,
    description: fee.description,
    payment_method: fee.payment_method,
    payment_reference: fee.payment_reference,
    payment_date: fee.payment_date,
    receipt_url: fee.receipt_url,
    payment_details: fee.payment_details as PaymentDetails | null,
    created_at: fee.created_at,
    updated_at: fee.updated_at,
    sync_status: (fee.sync_status || 'synced') as 'synced' | 'pending',
    fee_type: fee.fee_type,
    student_admission_number: student?.admission_number || fee.student_admission_number,
    student_name: student?.name || fee.student_name || null
  }
}

export const feeService = {
  async getFees(schoolId: string): Promise<Fee[]> {
    if (!navigator.onLine) {
      const db = await getDB()
      const fees = await db.getAllFromIndex('fees', 'by-school', schoolId)
      // Get student data for each fee
      const feesWithStudents = await Promise.all(
        fees.map(async (fee) => {
          const student = await db.get('students', fee.student_id)
          return {
            ...fee,
            students: student ? [{ name: student.name, admission_number: student.admission_number }] : null
          }
        })
      )
      return feesWithStudents.map(transformFee).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }

    const { data, error } = await supabase
      .from('fees')
      .select(`
        id,
        student_id,
        school_id,
        amount,
        amount_paid,
        date,
        due_date,
        status,
        description,
        payment_method,
        payment_reference,
        payment_date,
        receipt_url,
        payment_details,
        created_at,
        updated_at,
        sync_status,
        fee_type,
        student_admission_number,
        student_name,
        students:student_id (
          name,
          admission_number
        )
      `)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data as unknown as FeeWithStudent[]).map(transformFee)
  },

  async getStudentFees(studentId: string): Promise<Fee[]> {
    if (!navigator.onLine) {
      const db = await getDB()
      const fees = await db.getAllFromIndex('fees', 'by-student', studentId)
      // Get student data for each fee
      const feesWithStudents = await Promise.all(
        fees.map(async (fee) => {
          const student = await db.get('students', fee.student_id)
          return {
            ...fee,
            students: student ? [{ name: student.name, admission_number: student.admission_number }] : null
          }
        })
      )
      return feesWithStudents.map(transformFee).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }

    const { data, error } = await supabase
      .from('fees')
      .select(`
        id,
        student_id,
        school_id,
        amount,
        amount_paid,
        date,
        due_date,
        status,
        description,
        payment_method,
        payment_reference,
        payment_date,
        receipt_url,
        payment_details,
        created_at,
        updated_at,
        sync_status,
        fee_type,
        student_admission_number,
        students:student_id (
          name,
          admission_number
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data as unknown as FeeWithStudent[]).map(transformFee)
  },

  async getFee(id: string): Promise<Fee> {
    if (!navigator.onLine) {
      const db = await getDB()
      const fee = await db.get('fees', id)
      if (!fee) throw new Error('Fee not found')
      // Get student data
      const student = await db.get('students', fee.student_id)
      const feeWithStudent = {
        ...fee,
        students: student ? [{ name: student.name, admission_number: student.admission_number }] : null
      }
      return transformFee(feeWithStudent)
    }

    const { data, error } = await supabase
      .from('fees')
      .select(`
        id,
        student_id,
        school_id,
        amount,
        amount_paid,
        date,
        due_date,
        status,
        description,
        payment_method,
        payment_reference,
        payment_date,
        receipt_url,
        payment_details,
        created_at,
        updated_at,
        sync_status,
        fee_type,
        student_admission_number,
        students:student_id (
          name,
          admission_number
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return transformFee(data as unknown as FeeWithStudent)
  },

  async createFee(fee: FeeCreate): Promise<Fee> {
    const now = new Date().toISOString()
    
    // Get student data first
    let studentName = null
    if (!navigator.onLine) {
      const db = await getDB()
      const student = await db.get('students', fee.student_id)
      studentName = student?.name || null
    } else {
      const { data: student } = await supabase
        .from('students')
        .select('name')
        .eq('id', fee.student_id)
        .single()
      studentName = student?.name || null
    }

    const newFee = {
      id: crypto.randomUUID(),
      student_id: fee.student_id,
      school_id: fee.school_id,
      amount: fee.amount,
      amount_paid: 0,
      date: fee.date,
      due_date: fee.due_date || null,
      status: 'pending',
      description: fee.description || null,
      payment_method: null,
      payment_reference: null,
      payment_date: null,
      receipt_url: null,
      payment_details: null,
      created_at: now,
      updated_at: now,
      sync_status: 'pending' as const,
      fee_type: fee.fee_type || null,
      student_admission_number: fee.student_admission_number || null,
      student_name: studentName
    }

    if (!navigator.onLine) {
      const db = await getDB()
      await db.put('fees', newFee)
      await addToSyncQueue('fees', newFee.id, 'create', newFee)
      return newFee
    }

    const { data, error } = await supabase
      .from('fees')
      .insert(newFee)
      .select(`
        id,
        student_id,
        school_id,
        amount,
        amount_paid,
        date,
        due_date,
        status,
        description,
        payment_method,
        payment_reference,
        payment_date,
        receipt_url,
        payment_details,
        created_at,
        updated_at,
        sync_status,
        fee_type,
        student_admission_number,
        student_name,
        students:student_id (
          name,
          admission_number
        )
      `)
      .single()

    if (error) throw error

    return transformFee(data as unknown as FeeWithStudent)
  },

  async updateFee(id: string, fee: FeeUpdate): Promise<Fee> {
    const now = new Date().toISOString()
    const updatedFee = {
      ...fee,
      updated_at: now,
      sync_status: 'pending' as const
    }

    if (!navigator.onLine) {
      const db = await getDB()
      const existingFee = await db.get('fees', id)
      if (!existingFee) throw new Error('Fee not found')

      const mergedFee: Fee = {
        id: existingFee.id,
        student_id: existingFee.student_id,
        school_id: existingFee.school_id,
        amount: fee.amount ?? existingFee.amount,
        amount_paid: fee.amount_paid ?? existingFee.amount_paid,
        date: fee.date ?? existingFee.date,
        due_date: fee.due_date ?? existingFee.due_date,
        status: fee.status ?? existingFee.status,
        description: fee.description ?? existingFee.description,
        payment_method: fee.payment_method ?? existingFee.payment_method,
        payment_reference: fee.payment_reference ?? existingFee.payment_reference,
        payment_date: fee.payment_date ?? existingFee.payment_date,
        receipt_url: fee.receipt_url ?? existingFee.receipt_url,
        payment_details: fee.payment_details ?? existingFee.payment_details,
        created_at: existingFee.created_at,
        updated_at: now,
        sync_status: 'pending',
        fee_type: fee.fee_type ?? existingFee.fee_type,
        student_admission_number: fee.student_admission_number ?? existingFee.student_admission_number,
        student_name: existingFee.student_name
      }
      await db.put('fees', mergedFee)
      await addToSyncQueue('fees', id, 'update', mergedFee)
      return mergedFee
    }

    const { data, error } = await supabase
      .from('fees')
      .update(updatedFee)
      .eq('id', id)
      .select(`
        id,
        student_id,
        school_id,
        amount,
        amount_paid,
        date,
        due_date,
        status,
        description,
        payment_method,
        payment_reference,
        payment_date,
        receipt_url,
        payment_details,
        created_at,
        updated_at,
        sync_status,
        fee_type,
        student_admission_number,
        students:student_id (
          name,
          admission_number
        )
      `)
      .single()

    if (error) throw error

    return transformFee(data as unknown as FeeWithStudent)
  },

  async deleteFee(id: string): Promise<void> {
    if (!navigator.onLine) {
      const db = await getDB()
      const fee = await db.get('fees', id)
      if (!fee) throw new Error('Fee not found')
      await db.delete('fees', id)
      await addToSyncQueue('fees', id, 'delete', fee)
      return
    }

    const { error } = await supabase
      .from('fees')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async processPayment(feeId: string, payment: PaymentDetails): Promise<Fee> {
    const now = new Date().toISOString()
    const fee = await this.getFee(feeId)

    // Calculate new amount paid
    const currentAmountPaid = fee.amount_paid || 0
    const newAmountPaid = currentAmountPaid + payment.amount
    const isFullyPaid = newAmountPaid >= fee.amount

    // Get payment reference from payment details
    const paymentReference = payment.paymentDetails?.bank_slip_number || 
                           payment.paymentDetails?.account_number || 
                           payment.paymentDetails?.paybill_number || 
                           ''

    // Generate a transaction ID (use payment reference or fallback to timestamp)
    const transactionId = paymentReference || `TXN-${feeId}-${Date.now()}`

    const updatedFee: Fee = {
      ...fee,
      amount_paid: newAmountPaid,
      status: isFullyPaid ? 'paid' : 'pending',
      payment_method: payment.paymentMethod,
      payment_reference: paymentReference,
      payment_date: now,
      payment_details: payment.paymentDetails || null,
      // receipt_url will be set after notification
      updated_at: now,
      sync_status: 'pending'
    }

    if (!navigator.onLine) {
      const db = await getDB()
      await db.put('fees', updatedFee)
      await addToSyncQueue('fees', feeId, 'update', updatedFee)
      // Optionally, queue notification for later
      return updatedFee
    }

    // Update fee in Supabase
    const { data, error } = await supabase
      .from('fees')
      .update(updatedFee)
      .eq('id', feeId)
      .select()
      .single()

    if (error) throw error

    // Generate receipt and send notifications (email/SMS)
    try {
      // Dynamically import to avoid server/client issues
      const { generateReceiptAndNotify } = await import('@/app/actions/payment-notifications')
      await generateReceiptAndNotify(feeId, transactionId, payment.amount)
    } catch (notifyError) {
      console.error('Failed to send receipt/notification:', notifyError)
    }

    return data
  }
} 