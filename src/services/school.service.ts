import { supabase } from '@/lib/supabase/client'
import type { School } from '@/types/auth'

export const schoolService = {
  async create(data: {
    name: string
    email: string
    address?: string
    phone?: string
    subscription_plan: School['subscription_plan']
  }): Promise<School> {
    const { data: school, error } = await supabase
      .from('schools')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return school as School
  },

  async getById(id: string): Promise<School> {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as School
  },

  async update(id: string, data: Partial<School>): Promise<School> {
    const { data: school, error } = await supabase
      .from('schools')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return school as School
  },
} 