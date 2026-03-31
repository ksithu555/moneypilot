export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string
          name: string
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          currency?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          currency?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      household_members: {
        Row: {
          id: string
          household_id: string
          profile_id: string
          role: 'owner' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          profile_id: string
          role?: 'owner' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          profile_id?: string
          role?: 'owner' | 'member'
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          household_id: string
          name: string
          type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment' | 'loan'
          balance: number
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment' | 'loan'
          balance?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          type?: 'checking' | 'savings' | 'credit' | 'cash' | 'investment' | 'loan'
          balance?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          household_id: string
          name: string
          type: 'income' | 'expense'
          color: string
          icon: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          type: 'income' | 'expense'
          color?: string
          icon?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          type?: 'income' | 'expense'
          color?: string
          icon?: string | null
          is_default?: boolean
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          account_id: string
          category_id: string | null
          receipt_id: string | null
          amount: number
          type: 'income' | 'expense' | 'transfer'
          txn_date: string
          note: string | null
          payee: string | null
          is_recurring: boolean
          recurring_rule: Json | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          account_id: string
          category_id?: string | null
          receipt_id?: string | null
          amount: number
          type: 'income' | 'expense' | 'transfer'
          txn_date: string
          note?: string | null
          payee?: string | null
          is_recurring?: boolean
          recurring_rule?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          category_id?: string | null
          receipt_id?: string | null
          amount?: number
          type?: 'income' | 'expense' | 'transfer'
          txn_date?: string
          note?: string | null
          payee?: string | null
          is_recurring?: boolean
          recurring_rule?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      receipts: {
        Row: {
          id: string
          household_id: string
          storage_path: string
          raw_ocr: Json | null
          parse_status: 'pending' | 'processing' | 'completed' | 'failed'
          parsed_data: Json | null
          uploaded_by: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          household_id: string
          storage_path: string
          raw_ocr?: Json | null
          parse_status?: 'pending' | 'processing' | 'completed' | 'failed'
          parsed_data?: Json | null
          uploaded_by?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          storage_path?: string
          raw_ocr?: Json | null
          parse_status?: 'pending' | 'processing' | 'completed' | 'failed'
          parsed_data?: Json | null
          uploaded_by?: string | null
          uploaded_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          household_id: string
          category_id: string | null
          name: string
          target_amount: number
          saved_amount: number
          target_date: string | null
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          category_id?: string | null
          name: string
          target_amount: number
          saved_amount?: number
          target_date?: string | null
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          category_id?: string | null
          name?: string
          target_amount?: number
          saved_amount?: number
          target_date?: string | null
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      ai_insights: {
        Row: {
          id: string
          household_id: string
          type: 'judgement' | 'suggestion' | 'forecast'
          data: Json
          generated_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          household_id: string
          type: 'judgement' | 'suggestion' | 'forecast'
          data: Json
          generated_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          household_id?: string
          type?: 'judgement' | 'suggestion' | 'forecast'
          data?: Json
          generated_at?: string
          expires_at?: string
        }
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
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
