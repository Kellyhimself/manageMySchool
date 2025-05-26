export interface School {
  id: string
  name: string
  address?: string
  phone?: string
  email: string
  subscription_plan: 'core' | 'premium'
  createdAt: Date
  updatedAt: Date
  payment_settings?: {
    bank_name: string
    paybill_number: string
    account_number: string
    reference_format: 'admission_number' | 'student_name'
    api_credentials?: {
      api_key: string
      api_secret: string
      is_live: boolean
    }
  }
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'teacher' | 'parent'
  school_id: string
  createdAt: Date
  updatedAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials extends LoginCredentials {
  name: string
  role: User['role']
  school: {
    name: string
    email: string
    address?: string
    phone?: string
    subscription_plan: School['subscription_plan']
  }
}

export interface AuthResponse {
  user: User
  school: School
  session: {
    access_token: string
    refresh_token: string
  }
} 