import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { feeService } from '@/services/fee.service'
import { useAuth } from '@/hooks/use-auth'
import type { CreateFeeDTO, FeeFilters, UpdateFeeDTO, Fee, PaymentDetails } from '@/types/fee'
import { supabase } from '@/lib/supabase/client'

export function useFees(filters?: FeeFilters) {
  const { user, school } = useAuth()

  return useQuery({
    queryKey: ['fees', filters],
    queryFn: () => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to fetch fees')
      }
      return feeService.getAll({ ...filters, school_id: school.id })
    },
    enabled: !!user && !!school
  })
}

export function useFee(id: string) {
  const { user, school } = useAuth()

  return useQuery({
    queryKey: ['fees', id],
    queryFn: () => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to fetch fee')
      }
      return feeService.getById(id)
    },
    enabled: !!user && !!school,
    retry: 1,
    retryDelay: 1000,
  })
}

export function useCreateFee() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (data: CreateFeeDTO) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to create a fee')
      }

      // Add school_id to the fee data
      return feeService.create({
        ...data,
        school_id: school.id,
        date: new Date(),
        status: 'pending'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] })
    }
  })
}

export function useUpdateFee() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (data: UpdateFeeDTO) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to update a fee')
      }

      // Verify that the fee belongs to the school
      const fee = await feeService.getById(data.id)
      if (fee.school_id !== school.id) {
        throw new Error('Cannot update fee from a different school')
      }

      return feeService.update({
        ...data,
        school_id: school.id
      })
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
      const fee = await feeService.getById(id)
      if (fee.school_id !== school.id) {
        throw new Error('Cannot delete fee from a different school')
      }

      return feeService.delete(id)
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
      const fee = await feeService.getById(feeId)
      if (fee.school_id !== school.id) {
        throw new Error('Cannot process payment for fee from a different school')
      }

      return feeService.processPayment(feeId, {
        amount,
        paymentMethod,
        paymentDetails
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fees'] })
      queryClient.invalidateQueries({ queryKey: ['fees', variables.feeId] })
    }
  })
}

export function useMarkAsOverdue() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (feeId: string) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to mark fee as overdue')
      }

      // Verify that the fee belongs to the school
      const fee = await feeService.getById(feeId)
      if (fee.school_id !== school.id) {
        throw new Error('Cannot mark fee as overdue from a different school')
      }

      return feeService.markAsOverdue(feeId)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fees'] })
      queryClient.invalidateQueries({ queryKey: ['fees', data.id] })
    },
  })
} 