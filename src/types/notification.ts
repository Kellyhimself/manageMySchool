export interface Notification {
  id: string
  schoolId: string
  recipientPhone?: string
  recipientEmail?: string
  message: string
  type: 'sms' | 'email'
  status: 'pending' | 'sent' | 'failed'
  sentAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateNotificationDTO {
  schoolId: string
  recipientPhone?: string
  recipientEmail?: string
  message: string
  type: Notification['type']
}

export interface UpdateNotificationDTO extends Partial<CreateNotificationDTO> {
  id: string
  status?: Notification['status']
  sentAt?: Date
}

export interface NotificationFilters {
  schoolId?: string
  type?: Notification['type']
  status?: Notification['status']
  startDate?: Date
  endDate?: Date
  sortBy?: keyof Notification
  sortOrder?: 'asc' | 'desc'
} 