import { supabase } from '@/lib/supabase/client'

import { schoolService } from './school.service'
import type { AuthResponse, LoginCredentials, RegisterCredentials, School, User } from '@/types/auth'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) throw error

    if (!data.session) {
      throw new Error('No session created')
    }

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Failed to get authenticated user')

    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (dbError) throw dbError

    const school = await schoolService.getById(userData.school_id)

    return {
      user: userData as User,
      school,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    }
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    // First create the user account
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) throw error

    if (!data.session) {
      throw new Error('No session created')
    }

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Failed to get authenticated user')

    // Then create the school
    const school = await schoolService.create(credentials.school)

    // Finally create the user profile with school association
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: credentials.email,
        name: credentials.name,
        role: credentials.role,
        school_id: school.id,
      })
      .select()
      .single()

    if (dbError) throw dbError

    return {
      user: userData as User,
      school,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    }
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser(): Promise<{ user: User; school: School } | null> {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return null

    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (dbError) throw dbError

    const school = await schoolService.getById(userData.school_id)

    return {
      user: userData as User,
      school,
    }
  },
} 