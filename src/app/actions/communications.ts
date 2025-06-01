'use server'

import { createClient } from '@supabase/supabase-js'
import { NotificationService } from '@/services/notification.service'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendBulkMessageParams {
  message: string
  type: 'sms' | 'email'
  recipientIds: string[]
  schoolId: string
}

interface SendBulkMessageResult {
  success: boolean
  error?: string
  stats?: {
    success: number
    failed: number
  }
}

export async function sendBulkMessage({
  message,
  type,
  recipientIds,
  schoolId
}: SendBulkMessageParams): Promise<SendBulkMessageResult> {
  try {
    // Get recipients' contact information
    const { data: recipients, error: fetchError } = await supabase
      .from('students')
      .select('id, name, parent_phone, parent_email')
      .in('id', recipientIds)
      .eq('school_id', schoolId)

    if (fetchError) throw fetchError

    const stats = { success: 0, failed: 0 }
    const notificationService = type === 'sms' ? NotificationService.getInstance() : null

    // Create notification record
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        message,
        type,
        status: 'pending',
        school_id: schoolId
      })
      .select()
      .single()

    if (notificationError) throw notificationError

    // Send messages
    for (const recipient of recipients) {
      try {
        if (type === 'sms' && recipient.parent_phone) {
          if (!notificationService) {
            throw new Error('Notification service not initialized')
          }
          await notificationService.sendSMS(recipient.parent_phone, message)
          stats.success++
        } else if (type === 'email' && recipient.parent_email) {
          if (!process.env.RESEND_API_KEY) {
            throw new Error('Resend API key is not configured')
          }

          const emailResponse = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: recipient.parent_email,
            subject: 'School Communication',
            text: message
          })

          if (!emailResponse || emailResponse.error) {
            throw new Error(emailResponse?.error?.message || 'Failed to send email')
          }

          console.log(`Email sent successfully to ${recipient.parent_email}:`, emailResponse)
          stats.success++
        } else {
          console.warn(`No valid contact method for ${recipient.name}`)
          stats.failed++
        }
      } catch (error) {
        console.error(`Failed to send ${type} to ${recipient.name}:`, error)
        stats.failed++
      }
    }

    // Update notification status
    await supabase
      .from('notifications')
      .update({
        status: stats.failed === 0 ? 'sent' : 'failed',
        sent_at: new Date().toISOString()
      })
      .eq('id', notification.id)

    return {
      success: true,
      stats
    }
  } catch (error) {
    console.error('Failed to send bulk message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message'
    }
  }
}

export async function getCommunications(schoolId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return data.map(notification => ({
      ...notification,
      createdAt: new Date(notification.created_at),
      sentAt: notification.sent_at ? new Date(notification.sent_at) : undefined
    }))
  } catch (error) {
    console.error('Failed to fetch communications:', error)
    throw error
  }
} 