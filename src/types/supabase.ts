export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bank_webhook_logs: {
        Row: {
          bank_type: string
          created_at: string | null
          error_message: string | null
          id: string
          processed_at: string | null
          school_id: string
          status: string
          updated_at: string | null
          webhook_data: Json
        }
        Insert: {
          bank_type: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          school_id: string
          status: string
          updated_at?: string | null
          webhook_data: Json
        }
        Update: {
          bank_type?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          school_id?: string
          status?: string
          updated_at?: string | null
          webhook_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "bank_webhook_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_levels: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_levels_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          academic_year: string
          created_at: string
          date: string
          exam_type: string
          grade: string
          id: string
          passing_marks: number
          principal_remarks: string | null
          remarks: string | null
          school_id: string
          score: number
          student_id: string
          subject: string
          teacher_remarks: string | null
          term: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          date: string
          exam_type?: string
          grade: string
          id?: string
          passing_marks: number
          principal_remarks?: string | null
          remarks?: string | null
          school_id: string
          score: number
          student_id: string
          subject: string
          teacher_remarks?: string | null
          term: string
          total_marks: number
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          date?: string
          exam_type?: string
          grade?: string
          id?: string
          passing_marks?: number
          principal_remarks?: string | null
          remarks?: string | null
          school_id?: string
          score?: number
          student_id?: string
          subject?: string
          teacher_remarks?: string | null
          term?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fees: {
        Row: {
          academic_year: string | null
          amount: number
          amount_paid: number | null
          created_at: string
          date: string
          description: string | null
          due_date: string | null
          fee_type: string | null
          id: string
          payment_date: string | null
          payment_details: Json | null
          payment_method: string | null
          payment_reference: string | null
          receipt_url: string | null
          school_id: string
          status: string
          student_admission_number: string | null
          student_id: string
          student_name: string | null
          sync_status: string | null
          term: string | null
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          amount: number
          amount_paid?: number | null
          created_at?: string
          date: string
          description?: string | null
          due_date?: string | null
          fee_type?: string | null
          id?: string
          payment_date?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_url?: string | null
          school_id: string
          status: string
          student_admission_number?: string | null
          student_id: string
          student_name?: string | null
          sync_status?: string | null
          term?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          amount?: number
          amount_paid?: number | null
          created_at?: string
          date?: string
          description?: string | null
          due_date?: string | null
          fee_type?: string | null
          id?: string
          payment_date?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_url?: string | null
          school_id?: string
          status?: string
          student_admission_number?: string | null
          student_id?: string
          student_name?: string | null
          sync_status?: string | null
          term?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          recipient_email: string | null
          recipient_phone: string | null
          school_id: string
          sent_at: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          recipient_email?: string | null
          recipient_phone?: string | null
          school_id: string
          sent_at?: string | null
          status: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          school_id?: string
          sent_at?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_references: {
        Row: {
          amount: number
          bank_name: string | null
          bank_transaction_id: string | null
          created_at: string | null
          fee_id: string
          id: string
          payment_date: string | null
          payment_method: string | null
          reference: string
          school_id: string
          status: string
          student_admission_number: string
          student_name: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          bank_name?: string | null
          bank_transaction_id?: string | null
          created_at?: string | null
          fee_id: string
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          reference: string
          school_id: string
          status: string
          student_admission_number: string
          student_name: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_name?: string | null
          bank_transaction_id?: string | null
          created_at?: string | null
          fee_id?: string
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          reference?: string
          school_id?: string
          status?: string
          student_admission_number?: string
          student_name?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_references_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_references_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      report_cards: {
        Row: {
          academic_year: string
          average_marks: number
          class_position: number | null
          created_at: string
          exam_id: string | null
          grade: string
          id: string
          parent_signature: boolean | null
          principal_remarks: string | null
          school_id: string
          student_id: string | null
          teacher_remarks: string | null
          term: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          academic_year: string
          average_marks: number
          class_position?: number | null
          created_at?: string
          exam_id?: string | null
          grade: string
          id?: string
          parent_signature?: boolean | null
          principal_remarks?: string | null
          school_id: string
          student_id?: string | null
          teacher_remarks?: string | null
          term: string
          total_marks: number
          updated_at?: string
        }
        Update: {
          academic_year?: string
          average_marks?: number
          class_position?: number | null
          created_at?: string
          exam_id?: string | null
          grade?: string
          id?: string
          parent_signature?: boolean | null
          principal_remarks?: string | null
          school_id?: string
          student_id?: string | null
          teacher_remarks?: string | null
          term?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          bank_api_settings: Json | null
          created_at: string
          email: string
          id: string
          name: string
          payment_settings: Json | null
          phone: string | null
          subscription_plan: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          bank_api_settings?: Json | null
          created_at?: string
          email: string
          id?: string
          name: string
          payment_settings?: Json | null
          phone?: string | null
          subscription_plan: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          bank_api_settings?: Json | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          payment_settings?: Json | null
          phone?: string | null
          subscription_plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          admission_number: string | null
          class: string
          created_at: string
          id: string
          name: string
          parent_email: string | null
          parent_phone: string
          school_id: string
          sync_status: string
          updated_at: string
        }
        Insert: {
          admission_number?: string | null
          class: string
          created_at?: string
          id?: string
          name: string
          parent_email?: string | null
          parent_phone: string
          school_id: string
          sync_status?: string
          updated_at?: string
        }
        Update: {
          admission_number?: string | null
          class?: string
          created_at?: string
          id?: string
          name?: string
          parent_email?: string | null
          parent_phone?: string
          school_id?: string
          sync_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          id: string
          is_core: boolean | null
          level_id: string | null
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_core?: boolean | null
          level_id?: string | null
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_core?: boolean | null
          level_id?: string | null
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
