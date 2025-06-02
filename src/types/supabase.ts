
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
      user_settings: {
        Row: {
          id: string
          user_id: string
          settings: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          settings: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          settings?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          gmail_message_id: string
          id: string
          is_archived: boolean | null
          notes: string | null
          received_at: string
          sender_email: string
          snippet: string | null
          status: string | null
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gmail_message_id: string
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          received_at: string
          sender_email: string
          snippet?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gmail_message_id?: string
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          received_at?: string
          sender_email?: string
          snippet?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      enterprise_inquiries: {
        Row: {
          id: string
          created_at: string
          email: string
          company_name: string
          message: string | null
          user_id: string | null
          status: 'pending' | 'contacted' | 'closed'
          contacted_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          company_name: string
          message?: string | null
          user_id?: string | null
          status?: 'pending' | 'contacted' | 'closed'
          contacted_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          company_name?: string
          message?: string | null
          user_id?: string | null
          status?: 'pending' | 'contacted' | 'closed'
          contacted_at?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_inquiries_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
          google_access_token: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
          google_access_token?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
          google_access_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_stats: {
        Row: {
          created_at: string | null
          id: string
          last_activity_date: string | null
          leads_classified_today: number | null
          streak_days: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          leads_classified_today?: number | null
          streak_days?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          leads_classified_today?: number | null
          streak_days?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
