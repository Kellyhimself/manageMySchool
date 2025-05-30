import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface SchoolDB extends DBSchema {
  students: {
    key: string
    value: {
      id: string
      name: string
      class: string
      parent_phone: string
      parent_email: string | null
      school_id: string
      admission_number: string | null
      created_at: string
      updated_at: string
      sync_status: 'synced' | 'pending'
    }
    indexes: { 'by-school': string }
  }
  fees: {
    key: string
    value: {
      id: string
      student_id: string
      school_id: string
      amount: number
      amount_paid: number | null
      date: string
      due_date: string | null
      status: string
      description: string | null
      payment_method: string | null
      payment_reference: string | null
      payment_date: string | null
      receipt_url: string | null
      payment_details: Record<string, unknown> | null
      created_at: string
      updated_at: string
      sync_status: 'synced' | 'pending'
    }
    indexes: { 'by-school': string; 'by-student': string }
  }
  sync_queue: {
    key: string
    value: {
      id: string
      table_name: string
      record_id: string
      operation: 'create' | 'update' | 'delete'
      data: string
      created_at: string
      status: 'pending' | 'processing' | 'completed' | 'failed'
    }
  }
  auth_state: {
    key: string
    value: {
      id: string
      user_id: string
      school_id: string
      email: string
      name: string
      role: string
      created_at: string
      updated_at: string
      last_sync_at: string
      session: {
        access_token: string
        refresh_token: string
        expires_at: number
      }
      school: {
        id: string
        name: string
        email: string
        subscription_plan: string
        created_at: string
        updated_at: string
      }
    }
  }
  tanstack_cache: {
    key: string
    value: Record<string, unknown>
  }
}

let db: IDBPDatabase<SchoolDB> | null = null

export async function getDB() {
  if (db) return db

  db = await openDB<SchoolDB>('school-db', 1, {
    upgrade(database) {
      // Create students store
      const studentsStore = database.createObjectStore('students', { keyPath: 'id' })
      studentsStore.createIndex('by-school', 'school_id')

      // Create fees store
      const feesStore = database.createObjectStore('fees', { keyPath: 'id' })
      feesStore.createIndex('by-school', 'school_id')
      feesStore.createIndex('by-student', 'student_id')

      // Create sync queue store
      database.createObjectStore('sync_queue', { keyPath: 'id' })

      // Create auth state store
      database.createObjectStore('auth_state', { keyPath: 'id' })

      // Create tanstack cache store
      database.createObjectStore('tanstack_cache', { keyPath: 'id' })
    },
  })

  return db
}

export async function clearDB() {
  const database = await getDB()
  await database.clear('students')
  await database.clear('fees')
  await database.clear('sync_queue')
  await database.clear('auth_state')
  await database.clear('tanstack_cache')
} 