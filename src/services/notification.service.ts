import { supabase } from '@/lib/supabase/client'
import type { CreateNotificationDTO, Notification, NotificationFilters, UpdateNotificationDTO } from '@/types/notification'

export const notificationService = {
  async getAll(filters?: NotificationFilters): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')

    if (filters?.schoolId) {
      query = query.eq('schoolId', filters.schoolId)
    }

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.startDate) {
      query = query.gte('createdAt', filters.startDate.toISOString())
    }

    if (filters?.endDate) {
      query = query.lte('createdAt', filters.endDate.toISOString())
    }

    if (filters?.sortBy) {
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })
    }

    const { data, error } = await query

    if (error) throw error
    return data as Notification[]
  },

  async getById(id: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Notification
  },

  async create(notification: CreateNotificationDTO): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data as Notification
  },

  async update(notification: UpdateNotificationDTO): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        ...notification,
        sentAt: notification.sentAt?.toISOString(),
      })
      .eq('id', notification.id)
      .select()
      .single()

    if (error) throw error
    return data as Notification
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async markAsSent(id: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'sent',
        sentAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Notification
  },

  async markAsFailed(id: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'failed',
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Notification
  },
} 