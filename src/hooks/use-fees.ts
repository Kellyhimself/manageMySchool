import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { feeService } from '@/services/fee.service'
import { useAuth } from '@/hooks/use-auth'
import type { FeeCreate, FeeUpdate, FeeFilters } from '@/types/fee'
import { getDB } from '@/lib/indexeddb/client'
import { addToSyncQueue } from '@/lib/sync/sync-service'
import { supabase } from '@/lib/supabase'

export function useFees(filters?: FeeFilters) {
  const { school } = useAuth()
  
  return useQuery({
    queryKey: ['fees', { schoolId: school?.id, ...filters }],
    queryFn: async () => {
      if (!school) throw new Error('School context is required')
      
      try {
        // First try to get data from IndexedDB
        const db = await getDB()
        const cachedFees = await db.getAllFromIndex('fees', 'by-school', school.id)
        
        // If we're offline, get student data for each fee
        if (!navigator.onLine) {
          console.log('Offline mode: Using cached fees from IndexedDB')
          const feesWithStudents = await Promise.all(
            cachedFees.map(async (fee) => {
              const student = await db.get('students', fee.student_id)
              return {
                ...fee,
                students: student ? [{ name: student.name, admission_number: student.admission_number }] : null
              }
            })
          )
          return feesWithStudents.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        }
        
        // If online, fetch fresh data and update IndexedDB
        console.log('Online mode: Fetching fresh data from API')
        const freshFees = await feeService.getFees(school.id)
        
        // Update IndexedDB with fresh data
        for (const fee of freshFees) {
          await db.put('fees', fee)
        }
        
        return freshFees
      } catch (error) {
        console.error('Error fetching fees:', error)
        // If there's an error and we're offline, try to get data from IndexedDB
        if (!navigator.onLine) {
          console.log('Error occurred while offline: Using cached fees from IndexedDB')
          const db = await getDB()
          const fees = await db.getAllFromIndex('fees', 'by-school', school.id)
          const feesWithStudents = await Promise.all(
            fees.map(async (fee) => {
              const student = await db.get('students', fee.student_id)
              return {
                ...fee,
                students: student ? [{ name: student.name, admission_number: student.admission_number }] : null
              }
            })
          )
          return feesWithStudents.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
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

export async function createFeeOffline(data: FeeCreate) {
  const now = new Date().toISOString()
  
  // Get student data
  const db = await getDB()
  const student = await db.get('students', data.student_id)
  
  const tempId = crypto.randomUUID()
  const newFee = {
    ...data,
    id: tempId,
    created_at: now,
    updated_at: now,
    sync_status: 'pending' as const,
    amount_paid: 0,
    status: 'pending',
    payment_method: null,
    payment_reference: null,
    payment_date: null,
    receipt_url: null,
    payment_details: null,
    due_date: data.due_date || null,
    description: data.description || null,
    fee_type: data.fee_type || null,
    student_admission_number: student?.admission_number || data.student_admission_number || null,
    student_name: student?.name || null
  }

  try {
    // Store in IndexedDB first
    await db.put('fees', newFee)
    
    // Add to sync queue with the temporary ID
    await addToSyncQueue('fees', tempId, 'create', newFee)
    
    return newFee
  } catch (error) {
    console.error('Error creating fee offline:', error)
    throw new Error('Failed to create fee offline')
  }
}

export async function updateFeeOffline(id: string, data: FeeUpdate) {
  const now = new Date().toISOString()
  const db = await getDB()
  
  // Get existing fee
  const existingFee = await db.get('fees', id)
  if (!existingFee) throw new Error('Fee not found')

  const updatedFee = {
    ...existingFee,
    ...data,
    updated_at: now,
    sync_status: 'pending' as const
  }

  await db.put('fees', updatedFee)
  // Add to sync queue
  await addToSyncQueue('fees', id, 'update', updatedFee)
  return updatedFee
}

export function useFee(id: string) {
  const { user, school } = useAuth()

  return useQuery({
    queryKey: ['fees', id, school?.id],
    queryFn: async () => {
      if (!user || !school) {
        console.error('Auth context missing:', { user, school })
        throw new Error('User must be authenticated and have a school to fetch fee')
      }

      console.log('Fetching fee with context:', { feeId: id, schoolId: school.id })

      if (!navigator.onLine) {
        const db = await getDB()
        const fee = await db.get('fees', id)
        if (!fee) throw new Error('Fee not found')
        return fee
      }

      try {
        // Use the fee service instead of direct Supabase query
        const fee = await feeService.getFee(id)
        
        if (!fee) {
          console.error('Fee not found:', { feeId: id, schoolId: school.id })
          throw new Error('Fee not found')
        }

        return fee
      } catch (error) {
        console.error('Error in fee fetch process:', error)
        throw error
      }
    },
    enabled: !!school && !!id,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  })
}

export function useCreateFee() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (data: FeeCreate) => {
      if (!user || !school) {
        console.error('Auth context missing in createFee:', { user, school })
        throw new Error('User must be authenticated and have a school to create a fee')
      }

      const now = new Date().toISOString()
      const feeData = {
        ...data,
        school_id: school.id,
        date: now,
        created_at: now,
        updated_at: now,
        sync_status: 'pending',
        amount_paid: 0,
        status: 'pending',
        payment_method: null,
        payment_reference: null,
        payment_date: null,
        receipt_url: null,
        payment_details: null,
        due_date: data.due_date || null,
        description: data.description || null,
        fee_type: data.fee_type || null,
        student_admission_number: data.student_admission_number || null,
        term: data.term || null,
        academic_year: data.academic_year || null
      }

      console.log('Creating fee with data:', feeData)

      if (!navigator.onLine) {
        console.log('Offline mode detected in useCreateFee, using createFeeOffline')
        return createFeeOffline(feeData)
      }

      console.log('Online mode detected in useCreateFee, using feeService')
      return feeService.createFee(feeData)
    },
    onSuccess: async (data) => {
      console.log('Fee created successfully:', data)
      if (!navigator.onLine) {
        // When offline, update cache directly with data from IndexedDB
        const db = await getDB()
        const allFees = await db.getAllFromIndex('fees', 'by-school', school?.id || '')
        const feesWithStudents = await Promise.all(
          allFees.map(async (fee) => {
            const student = await db.get('students', fee.student_id)
            return {
              ...fee,
              students: student ? [{ name: student.name, admission_number: student.admission_number }] : null
            }
          })
        )
        const sortedFees = feesWithStudents.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        // Update the cache with all fees from IndexedDB
        queryClient.setQueryData(
          ['fees', { schoolId: school?.id }],
          sortedFees
        )
      } else {
        // When online, invalidate queries to trigger a refetch
        queryClient.invalidateQueries({ queryKey: ['fees'] })
      }
    }
  })
}

export function useUpdateFee() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (data: FeeUpdate & { id: string }) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to update a fee')
      }

      // Verify that the fee belongs to the school
      const fee = await feeService.getFee(data.id)
      if (fee.school_id !== school.id) {
        throw new Error('Cannot update fee from a different school')
      }

      const now = new Date().toISOString()
      const updateData = {
        ...data,
        updated_at: now,
        sync_status: 'pending'
      }

      return feeService.updateFee(data.id, updateData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fees'] })
      queryClient.invalidateQueries({ queryKey: ['fees', variables.id] })
    }
  })
}

export function useDeleteFee() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to delete a fee')
      }

      // Verify that the fee belongs to the school
      const fee = await feeService.getFee(id)
      if (fee.school_id !== school.id) {
        throw new Error('Cannot delete fee from a different school')
      }

      return feeService.deleteFee(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] })
    }
  })
}

export function useProcessPayment() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async ({ 
      feeId, 
      amount,
      paymentMethod,
      paymentDetails
    }: { 
      feeId: string
      amount: number
      paymentMethod: 'mpesa' | 'bank' | 'cash'
      paymentDetails?: {
        paybill_number?: string
        account_number?: string
        bank_name?: string
        bank_account?: string
        bank_slip_number?: string
      }
    }) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to process payment')
      }

      // Verify that the fee belongs to the school
      const fee = await feeService.getFee(feeId)
      if (fee.school_id !== school.id) {
        throw new Error('Cannot process payment for fee from a different school')
      }

      const result = await feeService.processPayment(feeId, {
        amount,
        paymentMethod,
        paymentDetails
      })

      // Get the receipt data from the notification service
      const { generateReceiptAndNotify } = await import('@/app/actions/payment-notifications')
      const receiptData = await generateReceiptAndNotify(feeId, result.payment_reference || `TXN-${feeId}-${Date.now()}`, amount)

      return {
        ...result,
        receiptHtml: receiptData.receiptHtml,
        receiptUrl: receiptData.receiptUrl
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fees'] })
      queryClient.invalidateQueries({ queryKey: ['fees', variables.feeId] })
    }
  })
} 