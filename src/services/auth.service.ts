import { supabase } from '@/lib/supabase/client'
import { schoolService } from './school.service'
import type { AuthResponse, LoginCredentials, RegisterCredentials, School, User } from '@/types/auth'
import { getDB } from '@/lib/indexeddb/client'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Try online login first
    if (navigator.onLine) {
      try {
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

        // Store auth state in IndexedDB
        const now = new Date().toISOString()
        const db = await getDB()
        await db.put('auth_state', {
          id: 'current',
          user_id: userData.id,
          school_id: userData.school_id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          created_at: now,
          updated_at: now,
          last_sync_at: now,
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at || Date.now() + 3600 * 1000, // Default 1 hour if not provided
          },
          school: {
            id: school.id,
            name: school.name,
            email: school.email,
            subscription_plan: school.subscription_plan,
            created_at: school.createdAt ? new Date(school.createdAt).toISOString() : now,
            updated_at: school.updatedAt ? new Date(school.updatedAt).toISOString() : now,
          }
        })

        return {
          user: userData as User,
          school,
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          },
        }
      } catch (error) {
        console.error('Online login failed:', error)
        throw error
      }
    }

    // Offline login - check IndexedDB
    const db = await getDB()
    const authState = await db.get('auth_state', 'current')
    
    if (!authState) {
      throw new Error('No offline credentials found. Please login while online first.')
    }

    // Verify stored credentials match
    if (authState.email !== credentials.email) {
      throw new Error('Email does not match stored credentials')
    }

    // Return stored auth state
    return {
      user: {
        id: authState.user_id,
        email: authState.email,
        name: authState.name,
        role: authState.role as 'admin' | 'teacher' | 'parent',
        school_id: authState.school_id,
        createdAt: new Date(authState.created_at),
        updatedAt: new Date(authState.updated_at)
      },
      school: {
        id: authState.school.id,
        name: authState.school.name,
        email: authState.school.email,
        subscription_plan: authState.school.subscription_plan as 'core' | 'premium',
        createdAt: authState.school.created_at ? new Date(authState.school.created_at).toISOString() : authState.created_at,
        updatedAt: authState.school.updated_at ? new Date(authState.school.updated_at).toISOString() : authState.updated_at,
      },
      session: {
        access_token: authState.session.access_token,
        refresh_token: authState.session.refresh_token,
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

    // Store auth state in IndexedDB
    const now = new Date().toISOString()
    const db = await getDB()
    await db.put('auth_state', {
      id: 'current',
      user_id: userData.id,
      school_id: userData.school_id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      created_at: now,
      updated_at: now,
      last_sync_at: now,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || Date.now() + 3600 * 1000, // Default 1 hour if not provided
      },
      school: {
        id: school.id,
        name: school.name,
        email: school.email,
        subscription_plan: school.subscription_plan,
        created_at: school.createdAt ? new Date(school.createdAt).toISOString() : now,
        updated_at: school.updatedAt ? new Date(school.updatedAt).toISOString() : now,
      }
    })

    return {
      user: userData as User,
      school,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    }
  },

  async getCurrentUser(): Promise<{ user: User; school: School } | null> {
    if (!navigator.onLine) {
      const db = await getDB()
      const authState = await db.get('auth_state', 'current')
      if (authState) {
        return {
          user: {
            id: authState.user_id,
            email: authState.email,
            name: authState.name,
            role: authState.role as 'admin' | 'teacher' | 'parent',
            school_id: authState.school_id,
            createdAt: new Date(authState.created_at),
            updatedAt: new Date(authState.updated_at)
          },
          school: {
            id: authState.school.id,
            name: authState.school.name,
            email: authState.school.email,
            subscription_plan: authState.school.subscription_plan as 'core' | 'premium',
            createdAt: authState.school.created_at ? new Date(authState.school.created_at).toISOString() : authState.created_at,
            updatedAt: authState.school.updated_at ? new Date(authState.school.updated_at).toISOString() : authState.updated_at,
          }
        }
      }
      return null
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return null

    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (dbError) throw dbError

    const school = await schoolService.getById(userData.school_id)

    // Update IndexedDB with latest data
    const now = new Date().toISOString()
    const db = await getDB()
    await db.put('auth_state', {
      id: 'current',
      user_id: userData.id,
      school_id: userData.school_id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      created_at: now,
      updated_at: now,
      last_sync_at: now,
      school: {
        id: school.id,
        name: school.name,
        email: school.email,
        subscription_plan: school.subscription_plan,
        created_at: school.createdAt ? new Date(school.createdAt).toISOString() : now,
        updated_at: school.updatedAt ? new Date(school.updatedAt).toISOString() : now,
      }
    })

    return {
      user: userData as User,
      school,
    }
  },

  async logout(): Promise<void> {
    if (navigator.onLine) {
      await supabase.auth.signOut()
    }
    
    // Clear auth state from IndexedDB
    const db = await getDB()
    await db.delete('auth_state', 'current')
  },

  async syncAuthState(): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline')
    }

    const db = await getDB()
    const authState = await db.get('auth_state', 'current')
    
    if (!authState) {
      throw new Error('No auth state to sync')
    }

    // Verify session is still valid
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      throw new Error('Invalid session')
    }

    // Update user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authState.user_id)
      .single()

    if (userError) throw userError

    const school = await schoolService.getById(userData.school_id)

    // Update IndexedDB with latest data
    const now = new Date().toISOString()
    await db.put('auth_state', {
      ...authState,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      updated_at: now,
      last_sync_at: now,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at || Date.now() + 3600 * 1000,
      },
      school: {
        id: school.id,
        name: school.name,
        email: school.email,
        subscription_plan: school.subscription_plan,
        created_at: school.createdAt ? new Date(school.createdAt).toISOString() : now,
        updated_at: school.updatedAt ? new Date(school.updatedAt).toISOString() : now,
      }
    })
  }
} 